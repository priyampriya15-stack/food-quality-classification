# Food Quality Classification – Dataset Selection, Preparation & Documentation

## ⚠️ Food Safety Disclaimer
> **Important**: Visual appearance alone **cannot** determine food safety, bacterial contamination, toxin presence, or microbiological pathogen levels. This dataset, along with any machine learning models trained on it, is solely designed for visual grading, educational research, and experimental quality assessment. Visual classification does not guarantee microbiological food safety or edibility.

---

## 1. Public Dataset Identification & Verification

For automated food quality assessment, we identify and document two verified public datasets commonly evaluated for produce freshness classification.

### Primary Recommended Dataset: Fruits Fresh and Rotten for Classification
- **Dataset Title**: Fruits fresh and rotten for classification
- **Original Curator / Uploader**: Sriram Reddy Kalluri
- **Source Platform**: Kaggle
- **Source URL**: [https://www.kaggle.com/datasets/sriramr/fruits-fresh-and-rotten-for-classification](https://www.kaggle.com/datasets/sriramr/fruits-fresh-and-rotten-for-classification)
- **Verified License**: **Unknown / Community Research** (Kaggle dataset card lists the license as "Unknown"). Recommended strictly for academic, educational, and research use.
- **Original Classes (6 Category Folders)**:
  1. `freshapples`
  2. `freshbanana`
  3. `freshoranges`
  4. `rottenapples`
  5. `rottenbanana`
  6. `rottenoranges`
- **Canonical Class Mapping**:
  - `freshapples`, `freshbanana`, `freshoranges` $\rightarrow$ **`Fresh`**
  - `rottenapples`, `rottenbanana`, `rottenoranges` $\rightarrow$ **`Spoiled`**

### Alternative Permissive Dataset: Fresh and Stale Images of Fruits and Vegetables
- **Dataset Title**: Fresh and Stale Images of Fruits and Vegetables
- **Source Platform**: Kaggle
- **Source URL**: [https://www.kaggle.com/datasets/raghavr/fresh-and-stale-images-of-fruits-and-vegetables](https://www.kaggle.com/datasets/raghavr/fresh-and-stale-images-of-fruits-and-vegetables)
- **Verified License**: **CC0: Public Domain** (Open and unencumbered for non-commercial and commercial study).
- **Original Classes**: Includes fresh and stale varieties of apples, bananas, oranges, tomatoes, bell peppers, etc.
- **Canonical Class Mapping**:
  - Folders with prefix/name `fresh*` $\rightarrow$ **`Fresh`**
  - Folders with prefix/name `stale*` / `rotten*` $\rightarrow$ **`Spoiled`**

### ⚠️ Status on "Moderate Quality" Class
- **Finding**: Public Kaggle produce freshness datasets contain binary labels (Fresh vs. Rotten / Stale). **No verified labels exist for "Moderate Quality"** in standard public benchmark sets.
- **Rule Compliance**: Following the strict project constraint (*"Do not create the Moderate Quality class unless suitable labeled training data exists"*), the pipeline initializes with the two verified classes: **`Fresh`** and **`Spoiled`**.

---

## 2. Download Instructions

### Method A: Manual Download via Browser (Recommended)
1. Open the Kaggle dataset page: [https://www.kaggle.com/datasets/sriramr/fruits-fresh-and-rotten-for-classification](https://www.kaggle.com/datasets/sriramr/fruits-fresh-and-rotten-for-classification).
2. Click the **Download** button (requires a free Kaggle account).
3. Extract the downloaded ZIP archive.
4. Place the raw image folders directly into `ml/data/raw/`. For example:
   ```text
   ml/data/raw/
   ├── freshapples/
   ├── freshbanana/
   ├── freshoranges/
   ├── rottenapples/
   ├── rottenbanana/
   └── rottenoranges/
   ```
   *(Or simply `ml/data/raw/fresh/` and `ml/data/raw/spoiled/`)*

### Method B: Kaggle CLI (Requires API Key)
If you have configured `kaggle.json` in `~/.kaggle/`:
```powershell
cd ml/data/raw
kaggle datasets download -d sriramr/fruits-fresh-and-rotten-for-classification --unzip
```

---

## 3. Dataset Configuration & Organization

The pipeline configuration is declared in [`ml/src/dataset_config.py`](file:///c:/Users/MI/OneDrive/Desktop/food-quality%20project/ml/src/dataset_config.py):
- **Image Input Resolution**: `224 × 224` pixels (compatible with CNN and EfficientNetB0).
- **Supported Formats**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`.
- **Reproducible Seed**: `42`.
- **Target Splits**:
  - **Train**: 70%
  - **Validation**: 15%
  - **Test**: 15%

---

## 4. Execution Workflow (Windows PowerShell)

### Step 1: Validate Raw Images
Scans `ml/data/raw/` for image readability, verifies file sizes, flags corrupt images, checks class labels, and generates [`validation_report.json`](file:///c:/Users/MI/OneDrive/Desktop/food-quality%20project/ml/data/validation_report.json):
```powershell
python ml/src/validate_dataset.py
```
*Optional verbose flag:*
```powershell
python ml/src/validate_dataset.py --verbose
```

### Step 2: Prepare and Split Dataset
Validates data, computes SHA-256 hashes to detect and skip duplicate images (preventing train-test data leakage), splits samples 70/15/15 with seed 42, and generates [`manifest.csv`](file:///c:/Users/MI/OneDrive/Desktop/food-quality%20project/ml/data/processed/manifest.csv) and [`dataset_summary.json`](file:///c:/Users/MI/OneDrive/Desktop/food-quality%20project/ml/data/processed/dataset_summary.json):
```powershell
python ml/src/prepare_dataset.py
```

### Processed Directory Output Layout:
```text
ml/data/processed/
├── manifest.csv
├── dataset_summary.json
├── train/
│   ├── Fresh/
│   └── Spoiled/
├── val/
│   ├── Fresh/
│   └── Spoiled/
└── test/
    ├── Fresh/
    └── Spoiled/
```

---

## 5. Dataset Limitations & Preprocessing Notes

1. **Visual Limitations**: Superficial surface defects (such as cosmetic skin blemishes or bruising) can occasionally resemble rot visually, while internal fungal decay or internal bacterial spoilage may have no external visual signs.
2. **Lighting and Angle Variances**: Produce photographs captured under varied illumination or smartphone cameras require image normalization and data augmentation (rotations, flips, zooming) during Phase 3 model training.
3. **Data Leakage Mitigation**: Preprocessing calculates SHA-256 cryptographic hashes for every image. Exact duplicates are isolated and skipped to prevent duplicate images from being distributed across both training and test splits.
4. **Reproducibility**: Shuffling is deterministically anchored by image hash sorting and seeded with `RANDOM_SEED = 42`.
