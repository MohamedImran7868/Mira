from datasets import load_dataset
import pandas as pd
from transformers import BertTokenizer, BertForSequenceClassification
import torch
from torch.utils.data import TensorDataset, DataLoader, RandomSampler, SequentialSampler
from transformers import AdamW, get_linear_schedule_with_warmup
from sklearn.metrics import accuracy_score, f1_score
import numpy as np

# Load the GoEmotions dataset
dataset = load_dataset('google-research-datasets/go_emotions')

# Convert to pandas DataFrames
train_df = pd.DataFrame(dataset['train'])
validation_df = pd.DataFrame(dataset['validation'])
test_df = pd.DataFrame(dataset['test'])

# Initialize the tokenizer
model_name = 'bert-base-uncased'
tokenizer = BertTokenizer.from_pretrained(model_name)

# Preprocess the text data
encoded_train_dataset = tokenizer.batch_encode_plus(
    train_df['text'].tolist(),
    truncation=True,
    padding='max_length',
    max_length=128,
    return_tensors="pt"
)

encoded_validation_dataset = tokenizer.batch_encode_plus(
    validation_df['text'].tolist(),
    truncation=True,
    padding='max_length',
    max_length=128,
    return_tensors="pt"
)

encoded_test_dataset = tokenizer.batch_encode_plus(
    test_df['text'].tolist(),
    truncation=True,
    padding='max_length',
    max_length=128,
    return_tensors="pt"
)

# Prepare labels for multi-label classification
num_classes = 27  # GoEmotions has 27 emotion classes

def multi_hot_encode(labels, num_classes):
    """
    Converts a list of label indices into a multi-hot encoded vector.
    Filters out any invalid label indices.
    """
    valid_labels = [label for label in labels if 0 <= label < num_classes]
    multi_hot = np.zeros(num_classes, dtype=int)
    multi_hot[valid_labels] = 1
    return multi_hot

# Apply multi-hot encoding to the labels
train_labels = torch.tensor(
    train_df['labels'].apply(lambda x: multi_hot_encode(x, num_classes)).tolist()
)
val_labels = torch.tensor(
    validation_df['labels'].apply(lambda x: multi_hot_encode(x, num_classes)).tolist()
)
test_labels = torch.tensor(
    test_df['labels'].apply(lambda x: multi_hot_encode(x, num_classes)).tolist()
)

# Prepare data for training
train_data = TensorDataset(
    encoded_train_dataset['input_ids'], 
    encoded_train_dataset['attention_mask'], 
    train_labels
)
train_sampler = RandomSampler(train_data)
train_dataloader = DataLoader(train_data, sampler=train_sampler, batch_size=32)

val_data = TensorDataset(
    encoded_validation_dataset['input_ids'], 
    encoded_validation_dataset['attention_mask'], 
    val_labels
)
val_sampler = SequentialSampler(val_data)
val_dataloader = DataLoader(val_data, sampler=val_sampler, batch_size=32)

# Load the model for multi-label classification
model = BertForSequenceClassification.from_pretrained(model_name, num_labels=num_classes)

# Use BCEWithLogitsLoss for multi-label classification
loss_function = torch.nn.BCEWithLogitsLoss()

# Set up optimizer and scheduler
optimizer = AdamW(model.parameters(), lr=2e-5)
scheduler = get_linear_schedule_with_warmup(
    optimizer, num_warmup_steps=0, num_training_steps=len(train_dataloader) * 3
)

# Device setup
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model.to(device)

# Training loop
for epoch in range(1):
    print(f"Epoch {epoch + 1}")
    model.train()
    total_loss = 0
    for step, batch in enumerate(train_dataloader):
        batch_inputs, batch_masks, batch_labels = tuple(t.to(device) for t in batch)
        model.zero_grad()
        outputs = model(
            input_ids=batch_inputs, 
            attention_mask=batch_masks
        )
        logits = outputs.logits
        loss = loss_function(logits, batch_labels.float())  # Multi-label loss
        total_loss += loss.item()
        loss.backward()
        optimizer.step()
        scheduler.step()

        if step % 50 == 0 and step > 0:
            print(f"Step {step}, Loss: {loss.item()}")

    print(f"Average training loss: {total_loss / len(train_dataloader)}")

# Evaluation loop on the validation set
model.eval()
predictions = []
true_labels = []

for batch in val_dataloader:
    batch_inputs, batch_masks, batch_labels = tuple(t.to(device) for t in batch)
    with torch.no_grad():
        outputs = model(input_ids=batch_inputs, attention_mask=batch_masks)
    logits = outputs.logits
    sigmoid_outputs = torch.sigmoid(logits)  # Sigmoid for multi-label probabilities
    predicted_labels = (sigmoid_outputs > 0.5).int()  # Threshold at 0.5
    predictions.extend(predicted_labels.cpu().numpy())
    true_labels.extend(batch_labels.cpu().numpy())

# Calculate evaluation metrics
accuracy = accuracy_score(np.array(true_labels).flatten(), np.array(predictions).flatten())
f1 = f1_score(true_labels, predictions, average='macro')
print(f"Validation Accuracy: {accuracy}")
print(f"Validation F1 Score: {f1}")

# Save the model
model.save_pretrained('emotion_model_27')
tokenizer.save_pretrained('emotion_model_27')
print("Model saved successfully!")
