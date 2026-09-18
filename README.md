# Year-Wise Refitting Framework for LSM
 A Year-Wise Refitting Framework for Static and Dynamic Spatiotemporal Prediction of Landslides using a Temporally Consistent Ensemble Model

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.20205386.svg)](https://doi.org/10.5281/zenodo.20205386)

## Overview
This repository contains the code, processing protocols, and datasets necessary to reproduce the Landslide Susceptibility Mapping (LSM) results presented in the manuscript: *"A Year-Wise Refitting Framework for Static and Dynamic Spatiotemporal Prediction of Landslides using a Temporally Consistent Ensemble Model"*. 

The workflow integrates multi-temporal remote sensing data processing via Google Earth Engine (GEE), QGIS, and Python, followed by predictive modeling using BiLSTM (for temporal dynamic factors) and Random Forest (for spatial susceptibility classification).

## Repository Structure

```text
├── data/
│   ├── raw_data_links.md                # Links and references for public raw data sources   
│   └── processed_data/                  # Formatted datasets required to run the GEE scripts
│       ├── Landslide2018comb2019Gemini.csv  # Attribute table of the landslide inventory (CSV copy of the shapefile)
│       └── processed_dataset_description.md # Metadata and details for the processed assets
├── scripts/
│   ├── gee_scripts/                     # JavaScript files for Google Earth Engine
│   │   ├── LSM Fin3 1RF News(NoSurfSoil) Points Used till 2024.js          # Original LSM script used (incl. Bag A / Bag B evaluation)
│   │   ├── LSM Fin3 1RF News(NoSurfSoil) Points Used till 2024 Shrinked.js # Simplified LSM script for reviewers (incl. Bag A / Bag B evaluation)
│   │   ├── LSM Fin2 1RF News(NoSurfSoil) Points Used till 2024 Cloud Burst Forecasted_100AllData.js          # 2025 forecast + cloudburst scenario LSM
│   │   └── LSM Fin2 1RF News(NoSurfSoil) Points Used till 2024 Cloud Burst Forecasted_100AllData Shrinked.js # Simplified 2025 forecast scenario LSM (+100 mm rainfall)
│   ├── python_notebooks/                # Jupyter/Colab notebooks (and .py exports) for BiLSTM prediction and post-processing
│   │   ├── CloudBurst_Creation_in_Rainfall_Maps.ipynb       # Injects synthetic cloudburst hotspots into a rainfall raster
│   │   ├── Confidence_BagA,_BagB_AUCs_Wayanad.ipynb         # Bootstrap 95% confidence intervals for Bag A / Bag B AUCs
│   │   └── *.py                                             # Plain-Python exports of the Colab notebooks
│   └── qgis_workflow.md                 # Step-by-step processing protocol for manual QGIS tasks
├── README.md                            # Project documentation
└── requirements.txt                     # Python dependencies for the local/Colab ML environments

```

## Data Availability

The raw spatial and temporal datasets analyzed during the current study are publicly available from their respective host agencies (detailed in `data/raw_data_links.md`).

The intermediate processed feature datasets, model configurations, and the final variables generated to execute the landslide susceptibility mapping are permanently archived in the Zenodo repository linked via the DOI badge above.

## Prerequisites & Environment

To execute the workflows in this repository, the following platforms and libraries are required:

* **Google Earth Engine:** An active GEE account is required to run the JavaScript files.
* **GIS Software:** QGIS.
* **Python Environment:** Python 3.x with libraries specified in `requirements.txt`. Code is optimized for execution within Google Colab.

---

## Workflow Instructions

### 1. Preprocessing (Python, QGIS, & GEE)

**Rainfall Preprocessing (Python):**

* IMD Pune Gridded NetCDF data (0.25° x 0.25°) for the entire year was converted into individual daily GeoTIFF files using a custom Python script.
* A secondary Python script was used to merge these daily TIFFs into a single multi-band GeoTIFF.
* This file was uploaded to GEE, reprojected and resampled to a 100m resolution, clipped to the Wayanad boundary, and processed to calculate the daily mean rainfall for the year.

**Soil Moisture Aggregation (GEE):**

* NASA SMAP data (providing 3/4-hourly measurements) was temporally aggregated within GEE.
* Due to the large computational scale of the Wayanad district, data was first processed individually by month, and those monthly composites were subsequently averaged to synthesize the yearly continuous 24-hour daily soil moisture profile.

**GIS Preprocessing (Manual QGIS Steps):**

* See `scripts/qgis_workflow.md` for the complete manual protocol regarding Area of Interest (AOI) delineation and DEM mosaicking.

### 2. Temporal Prediction (BiLSTM)

The temporal prediction of dynamic factors (Rainfall and Soil Moisture) was executed locally/via Google Colab using Python.

1. The Wayanad study area was tessellated into 5km x 5km grids.
2. The mean values for rainfall and soil moisture were extracted for each grid cell over a 10-year historical period.
3. These sequential grid grids were fed into a BiLSTM network to predict the localized rainfall and soil moisture values for the subsequent target year.
4. Execute the notebooks located in `scripts/python_notebooks/` after running `pip install -r requirements.txt`.

Plain-Python exports of the Colab notebooks are also provided (`imd_days_to_oneband.py`, `netcdf_to_daily_geotiff.py`, `lstm2.py`, `soilmoisture.py`) for readers who prefer to inspect the code without Jupyter. They were generated by Colab's *Download .py* option, so shell lines such as `pip install ...` must be run separately, and the `/content/...` file paths must be updated to your local paths.

### 3. Spatial Prediction & LSM (Random Forest in GEE)

The final Landslide Susceptibility Mapping and Random Forest classification were executed entirely within Google Earth Engine to leverage its ability to handle large-scale environmental factors.

**Instructions for Reviewers to Recreate Results:**
To facilitate the peer-review process, a streamlined, simplified version of the main classification code has been provided: `LSM Fin3 1RF News(NoSurfSoil) Points Used till 2024 Shrinked` (located in `scripts/gee_scripts/`).

To run this script and recreate the LSM outputs:

1. **Download Data:** Retrieve the processed input datasets located in the `data/processed_data/` folder of this repository. (Reference `processed_dataset_description.md` for details).
2. **Upload to GEE:** Upload these specific datasets as Assets to your personal Google Earth Engine account.
3. **Update Script Paths:** Open the `LSM Fin3 1RF News(NoSurfSoil) Points Used till 2024 Shrinked` script in the GEE Code Editor. Manually update the asset paths (`ee.Image()` and `ee.FeatureCollection()` calls at the top of the script) to point to the newly uploaded assets in your account.
4. **Execute:** Run the script. The code will automatically process the training/testing splits based on the temporal landslide inventory (training on historical points, testing on the current year).
5. **Outputs:** The GEE console will generate the reclassified susceptibility map, the Feature Importance chart, and extended Accuracy Assessment metrics (including the ROC curve, AUC score, Precision, Recall, and F1-Score charts).

### 4. Additional Evaluation: Conventional Split vs. Target-Year Forward Test (Bag A / Bag B)

Both `LSM Fin3` scripts (original and `Shrinked`) end with an additional evaluation block. It reuses the **same trained Random Forest model** (`rfclass`) and leaves all of the code above it unchanged.

* **Bag A (conventional):** the random 30% hold-out of the historical points (landslide and non-landslide).
* **Bag B (target year):** the landslides of the target year (`endYear`), combined with the held-out non-landslide points.

For each bag, the script prints the positive and negative counts, the AUC, and an ROC chart to the GEE console. It also creates these Google Drive export tasks:

* `scored_A_conventional_<endYear>` / `scored_B_targetyear_<endYear>`: the predicted probability (`classification`) and true label (`is_target`) for each point.
* `ROC_comparison_<endYear>`: the ROC tables for both bags (TPR, FPR, TP/TN/FP/FN, accuracy, precision, recall, F1 at each cut-off), so both curves can be plotted in a single figure.

**Confidence intervals:** put the exported `scored_*.csv` files in the same folder as `scripts/python_notebooks/Confidence_BagA,_BagB_AUCs_Wayanad.ipynb` and run the notebook. It computes each AUC with a 95% bootstrap confidence interval (1,000 resamples, seed 42).

### 5. Scenario Analysis: 2025 Forecasted Conditions & Cloudburst Simulation

The `LSM Fin2 ... Cloud Burst Forecasted_100AllData` scripts use the Phase 1 forecasts to project susceptibility for the target year `endYear = 2025`. For years from 2025 onward, they load the BiLSTM-forecasted assets (`Annual_SMAP_Mean_Year_<YYYY>_FORECASTED` and `<YYYY>mean_rainfall_100m_FORECASTED`, created with the `Forecasted ... CSV to Raster.js` scripts).

* **Full script** (`...Forecasted_100AllData.js`): simulates localized cloudburst events.
  1. Export the averaged rainfall raster (`avg_rainfall_for_CloudBurstProcessingIncolab<endYear>`) to Google Drive.
  2. Run `scripts/python_notebooks/CloudBurst_Creation_in_Rainfall_Maps.ipynb`. It adds a linearly decaying rainfall increment around each chosen hotspot (the latest configuration uses 4 centres with +150 mm at each centre and a 7 km radius). Where hotspots overlap, the largest increment is used.
  3. Upload the result (`<endYear>mean_rainfall_100m_CloudBurst_4Points`) back to GEE as an asset. The script then uses it as the precipitation factor and exports the `_CloudBurst` susceptibility maps.
* **Shrinked script** (`...Forecasted_100AllData Shrinked.js`): a simplified version for reviewers. It averages the rainfall of the three preceding years, adds a uniform **+100 mm** across the whole district, and then trains the Random Forest and produces the reclassified and smoothed susceptibility maps.

As in Section 3, update the asset paths at the top of these scripts to point to your own GEE assets before running them.
