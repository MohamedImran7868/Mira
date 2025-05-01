from datasets import load_dataset

# Load the GoEmotions dataset
dataset = load_dataset('google-research-datasets/go_emotions')

# Explore the dataset
print(dataset)
print(dataset['train'][0])
print(dataset['train'].features)