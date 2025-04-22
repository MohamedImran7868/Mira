import Header from "../../Header";
import styles from "./AddResources.module.css";

function AddResources(){
    return(
        <>
        <Header/>
        <div className={styles.container}>
            <div className={styles.topContainer}>
                <label className={styles.type}>Type:</label>
                <select className={styles.typeSelect}>
                    <option value="assosiation">Assosiation</option>
                    <option value="consultant">Consultant</option>
                </select>
            </div>
            <div className={styles.formContainer}>
                <form className={styles.form}>
                    <div className={styles.details}>
                        <div>
                            <label className={styles.label}>Name:</label>
                            <input type="text" className={styles.input} required/>
                        </div>
                        <div>
                            <label className={styles.label}>Contact:</label>
                            <input type="email" className={styles.input} required/>
                        </div>
                        <div>
                            <label className={styles.label}>Time:</label>
                            <input type="text" className={styles.input} required/>
                        </div>
                    </div>
                    
                    <label className={styles.label}>Description:</label>
                    <textarea type="text" className={styles.textarea} maxLength="1000" required/>
                </form>
            </div>
            <div className={styles.btnContainer}>
                <button className={styles.backBtn}>Back</button>
                <button className={styles.submitBtn}>Submit</button>
            </div>
        </div>
        </>
    );
}

export default AddResources;