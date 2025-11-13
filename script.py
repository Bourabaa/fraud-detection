import argparse
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import sklearn
import joblib
import os
import numpy as np
import pandas as pd
import sys
import traceback

def model_fn(model_dir):
    """Load the model for inference"""
    clf = joblib.load(os.path.join(model_dir, "model.joblib"))
    return clf

if __name__ == "__main__":
    try:
        print("[INFO] Starting script execution")
        print("[INFO] Python version:", sys.version)
        print("[INFO] Scikit-learn version:", sklearn.__version__)
        
        parser = argparse.ArgumentParser()
        
        # Hyperparameters
        parser.add_argument("--n_estimators", type=int, default=100)
        parser.add_argument("--random_state", type=int, default=0)
        parser.add_argument("--verbose", type=int, default=1)

        # Directories
        parser.add_argument("--model-dir", type=str, default=os.environ.get("SM_MODEL_DIR"))
        parser.add_argument("--train", type=str, default=os.environ.get("SM_CHANNEL_TRAIN"))
        parser.add_argument("--test", type=str, default=os.environ.get("SM_CHANNEL_TEST"))
        
        args, _ = parser.parse_known_args()
        print("[INFO] Arguments:", vars(args))
        
        # Load data
        print("\n[INFO] Loading training data...")
        train_path = os.path.join(args.train, "train.csv")
        test_path = os.path.join(args.test, "test.csv")
        
        print(f"[INFO] Train path: {train_path}")
        print(f"[INFO] Test path: {test_path}")
        
        # Read CSV without header
        train_df = pd.read_csv(train_path, header=None)
        test_df = pd.read_csv(test_path, header=None)
        
        print(f"[INFO] Train shape: {train_df.shape}")
        print(f"[INFO] Test shape: {test_df.shape}")
        print(f"[INFO] Train columns: {train_df.shape[1]}")
        
        # Split features and labels - assuming last column is the target
        X_train = train_df.iloc[:, :-1].values
        y_train = train_df.iloc[:, -1].values
        X_test = test_df.iloc[:, :-1].values
        y_test = test_df.iloc[:, -1].values
        
        print(f"[INFO] X_train shape: {X_train.shape}")
        print(f"[INFO] y_train shape: {y_train.shape}")
        print(f"[INFO] Class distribution in training: {np.unique(y_train, return_counts=True)}")
        
        # Train model
        print("\n[INFO] Training RandomForest Model...")
        model = RandomForestClassifier(
            n_estimators=args.n_estimators,
            random_state=args.random_state,
            verbose=args.verbose,
            n_jobs=-1
        )
        
        model.fit(X_train, y_train)
        print("[INFO] Training completed!")
        
        # Evaluate on training data
        train_pred = model.predict(X_train)
        train_acc = accuracy_score(y_train, train_pred)
        print(f"\n[INFO] Training Accuracy: {train_acc:.4f}")
        
        # Evaluate on test data
        print("\n[INFO] Evaluating model on test set...")
        y_pred = model.predict(X_test)
        test_acc = accuracy_score(y_test, y_pred)
        print(f"[INFO] Test Accuracy: {test_acc:.4f}")
        
        print("\n[INFO] Classification Report:")
        print(classification_report(y_test, y_pred))
        
        # Save model
        print("\n[INFO] Saving model...")
        os.makedirs(args.model_dir, exist_ok=True)
        model_path = os.path.join(args.model_dir, "model.joblib")
        joblib.dump(model, model_path)
        print(f"[INFO] Model saved to: {model_path}")
        
        # Verify model was saved
        if os.path.exists(model_path):
            print(f"[INFO] Model file size: {os.path.getsize(model_path)} bytes")
        else:
            print("[ERROR] Model file was not created!")
        
        print("\n[INFO] Script completed successfully!")
        
    except Exception as e:
        print("\n[ERROR] An error occurred:")
        print(traceback.format_exc())
        sys.exit(1)
