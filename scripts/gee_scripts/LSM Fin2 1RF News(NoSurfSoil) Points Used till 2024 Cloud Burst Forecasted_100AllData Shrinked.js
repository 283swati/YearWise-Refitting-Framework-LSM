var wayanad = ee.FeatureCollection('projects/ee-ce23resch11016/assets/ISRO_Wayanad_District_BDY');
var geometry = wayanad.geometry();
var combinedDEMTile = ee.Image('projects/ee-ce23resch11016/assets/merged_cdnc43d_cdnc43e');
var endYear = 2025;
var elevation = combinedDEMTile.rename('elevation'); // Rename the DEM band to 'elevation' instead of 'b1'
var slope = ee.Terrain.slope(elevation);
var aspect = ee.Terrain.aspect(elevation);
Map.centerObject(wayanad, 10);
Map.addLayer(wayanad, {color: 'grey', fillColor: '00000000'}, 'Wayanad Transparent Boundary');
var wayanadBorder =
    ee.Image().byte().paint({featureCollection: wayanad, color: 1, width: 3});
Map.addLayer(wayanadBorder, null, 'Wayanad Border');
var hillshade = ee.Terrain.hillshade(elevation);
var slopeC = ee.Terrain.slope(combinedDEMTile);
var focalMeanSlope = slopeC.convolve(ee.Kernel.circle(3, 'pixels', true));
var curvature = slopeC.subtract(focalMeanSlope);
var hillshadeStats = hillshade.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: wayanad,
  scale: 30,
  maxPixels: 1e9
});
var minHillshade = hillshadeStats.get('hillshade_min');
var maxHillshade = hillshadeStats.get('hillshade_max');
var hillshadeVis = {
  min: ee.Number(minHillshade).getInfo(),
  max: ee.Number(maxHillshade).getInfo(),
  palette: ['black', 'white'] // You can adjust the palette as needed
};
Map.addLayer(hillshade.clip(wayanad), hillshadeVis, 'Dynamic Hillshade', true, 0.4); // Opacity set to 0.5 (50%)
var reliefClasses = ee.Image('projects/ee-ce23resch11016/assets/Relief_Classes');
var dw = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1');
var startDate = '2024-01-01';
var endDate = '2024-10-01';
var dynamicWorld = dw.filterDate(startDate, endDate)
                     .filterBounds(wayanad);
var dwImage = dynamicWorld.mode().clip(wayanad);
var classNames = [
  'Water', 'Trees', 'Grass', 'Flooded Vegetation', 'Crops', 'Shrub', 
  'Built Area', 'Bare Ground', 'Snow/Ice'
];
var landcoverPalette = [
  '#ADD8E6', // Water: Light Blue
  '#006400', // Trees: Dark Green
  '#808000', // Grass: Olive Green
  '#FFA500', // Flooded Vegetation: Orange
  '#FFFF00', // Crops: Yellow
  '#90EE90', // Shrub: Light Green
  '#FFC0CB', // Built Area: Pink
  '#696969', // Bare Ground: Dark Grey
  '#E6E6FA'  // Snow/Ice: Light Purple
];
var scale = 100; // Approx. 0.01 degrees at the equator
function getMeanRootSoilMoisture(year) {
  var imageName;
  if (year >= 2025) {
    imageName = 'projects/ee-ce23resch11016/assets/SMAP_AnnualMean/Annual_SMAP_Mean_Year_' + year + '_FORECASTED';
  } else {
    imageName = 'projects/ee-ce23resch11016/assets/SMAP_AnnualMean/Annual_SMAP_Mean_Year_' + year;
  }
  var soilMoisture = ee.Image(imageName).select('sm_rootzone');
  return soilMoisture.clip(wayanad);
}
var years = [endYear-3,endYear-2,endYear-1,endYear];
print(years)
var rootzoneSoilMoistureImages = years.map(function(year) {
  return getMeanRootSoilMoisture(year);
});
var rootzoneSoilMoistureAllYears = ee.ImageCollection(rootzoneSoilMoistureImages).mean().rename('rootzone_soil_moisture');
function getMeanRainfallData(year) {
  var imageName;
  if (year >= 2025) {
    imageName = 'projects/ee-ce23resch11016/assets/IMD/' + year + 'mean_rainfall_100m_FORECASTED';
  } else {
    imageName = 'projects/ee-ce23resch11016/assets/IMD/' + year + 'mean_rainfall_100m';
  }
  var rainfall = ee.Image(imageName);
  return rainfall.clip(wayanad);
}
var yearsToAverage = [endYear - 3, endYear - 2, endYear - 1];
var avgOfPastYears = ee.ImageCollection.fromImages(
  yearsToAverage.map(getMeanRainfallData)
).mean();
var IMDRainMeanAllYears = avgOfPastYears.add(100).rename('precipitation');
var geology = ee.FeatureCollection('projects/ee-ce23resch11016/assets/Bhukosh_Assets/Geology_2M_Bhukosh');
geology = geology.filterBounds(geometry);
var geomorphology = ee.FeatureCollection('projects/ee-ce23resch11016/assets/Bhukosh_Assets/Geomorphology_250K_Bhukosh');
geomorphology = geomorphology.filterBounds(geometry);
var lithology = ee.FeatureCollection('projects/ee-ce23resch11016/assets/Bhukosh_Assets/Lithology_Bhukosh');
lithology = lithology.filterBounds(geometry);
var landslidePoints = ee.FeatureCollection('projects/ee-ce23resch11016/assets/Points2018comb2019/Landslide2018comb2019Gemini')
                          .filterBounds(geometry);
var startYear = 2018;
var years = [];
for (var year = startYear; year <= endYear; year++) {
  years.push(year.toString());
}
landslidePoints = landslidePoints.filter(ee.Filter.inList('Year', years));
var nonLandslidePoints = ee.FeatureCollection('projects/ee-ce23resch11016/assets/Points2018comb2019/Non-Landslide2018comb2019Gemini')
                          .filterBounds(geometry);
var elevation = elevation.reproject('EPSG:4326', null, 30).rename('elevation_class')
var slope = ee.Terrain.slope(elevation);
var slope = slope.reproject('EPSG:4326', null, 30).rename('slope_class')
var aspect = ee.Terrain.aspect(elevation);
var aspect = aspect.reproject('EPSG:4326', null, 30).rename('aspect_class')
curvature = curvature.reproject('EPSG:4326', null, 30).rename('curvature_class')
var reliefClasses = reliefClasses.reproject('EPSG:4326', null, 30).rename('classifiedRelief_class')
var lulcClass = dwImage.select('label').add(1).reproject('EPSG:4326', null, 30).rename('landcover_class');
var rootzoneSoilMoisture = rootzoneSoilMoistureAllYears.reproject('EPSG:4326', null, 30).rename('rootzone_moisture_class');
var IMDRainMean = IMDRainMeanAllYears.reproject('EPSG:4326', null, 30).rename('mean_rainfall_class');
var geologyCategories = geology.aggregate_array('STRATIGRAP').distinct();
var geologyCategoryDict = ee.Dictionary.fromLists(geologyCategories, ee.List.sequence(1, geologyCategories.size()));
var geologyWithCodes = geology.map(function(feature) {
  var category = ee.String(feature.get('STRATIGRAP')).trim();
  var code = geologyCategoryDict.get(category);  // Get the unique code from dictionary
  return feature.set('category_code', code);  // Add code as a property
});
var geologyImage = geologyWithCodes.reduceToImage({
  properties: ['category_code'],
  reducer: ee.Reducer.first()
}).reproject('EPSG:4326', null, 30).rename('geology_class');
var lithologyCategories = lithology.aggregate_array('STRATIGRAP').distinct();
var lithologyCategoryDict = ee.Dictionary.fromLists(lithologyCategories, ee.List.sequence(1, lithologyCategories.size()));
var lithologyWithCodes = lithology.map(function(feature) {
  var category = ee.String(feature.get('STRATIGRAP')).trim();
  var code = lithologyCategoryDict.get(category);  // Get the unique code from dictionary
  return feature.set('category_code', code);  // Add code as a property
});
var lithologyImage = lithologyWithCodes.reduceToImage({
  properties: ['category_code'],
  reducer: ee.Reducer.first()
}).reproject('EPSG:4326', null, 30).rename('lithology_class');
var geomorphologyCategories = geomorphology.aggregate_array('DESCRIPTIO').distinct();
var geomorphologyCategoryDict = ee.Dictionary.fromLists(geomorphologyCategories, ee.List.sequence(1, geomorphologyCategories.size()));
var geomorphologyWithCodes = geomorphology.map(function(feature) {
  var category = ee.String(feature.get('DESCRIPTIO')).trim();
  var code = geomorphologyCategoryDict.get(category);  // Get the unique code from dictionary
  return feature.set('category_code', code);  // Add code as a property
});
var geomorphologyImage = geomorphologyWithCodes.reduceToImage({
  properties: ['category_code'],
  reducer: ee.Reducer.first()
}).reproject('EPSG:4326', null, 30).rename('geomorphology_class');
var flowaccumulation = ee.Image("MERIT/Hydro/v1_0_1").select('upa')
                    .log() // Log-transform for visualization
                    .clip(geometry) // Clip to Wayanad geometry
                    .reproject('EPSG:4326', null, 30)
                    .rename('FWACC');
var hand = ee.Image("users/gena/GlobalHAND/30m/hand-1000")
            .clip(geometry)
            .reproject('EPSG:4326', null, 30)
            .rename('HAND');
var meanTPI = elevation.focalMean(5, 'square'); // Note: elevation_extend should be defined in your workspace
var tpi = elevation.subtract(meanTPI)  // Subtract focal mean from elevation
           .reproject('EPSG:4326', null, 30)
           .rename('mTPI')
           .clip(geometry);
var rivers = ee.Image("MERIT/Hydro/v1_0_1").select('upa')
              .clip(geometry)
              .gt(0.5);  // Threshold for river network
var maxDistM = 7500;  // Maximum distance in meters
var euclideanKernel = ee.Kernel.euclidean(maxDistM, 'meters');
var hdtp = rivers.distance(euclideanKernel) // Calculate distance to river network
           .reproject('EPSG:4326', null, 30)
           .rename('HDND');
var hillshade = ee.Terrain.hillshade(elevation, 90, 45).rename('HLSH')
var hillshade = hillshade.reproject('EPSG:4326', null, 30)
var combinedLSMFactors = slope.addBands(aspect).addBands(elevation).addBands(hillshade).addBands(curvature).addBands(reliefClasses)
                    .addBands(lulcClass).addBands(rootzoneSoilMoisture).addBands(IMDRainMean).addBands(geologyImage)
                    .addBands(geomorphologyImage).addBands(lithologyImage).addBands(hand).addBands(flowaccumulation)
                    .addBands(tpi).addBands(hdtp)
print('Updated Combined LSM Factors:', combinedLSMFactors);
nonLandslidePoints = nonLandslidePoints.map(function(pt) {
  return pt.set('landslide', 0);
});
var labeledLandslidePoints = landslidePoints.select('landslide').map(function(pt) {
  return pt.set('landslide', 1);
});
var trainingPoints = labeledLandslidePoints.merge(nonLandslidePoints);
var trainingData = combinedLSMFactors.reduceRegions({
  collection: trainingPoints,
  reducer: ee.Reducer.mean(),
  scale: 30 // Adjust the scale to match your dataset resolution
});
var bandNames = combinedLSMFactors.bandNames();
    print(bandNames, "band useds in training")
var samples_dataset = trainingData.randomColumn('random');
var samples_no_nulls = samples_dataset.filter(ee.Filter.notNull(['landslide']));
var training = samples_no_nulls;
var treeMapping = {
  2020: 159,
  2021: 301,
  2022: 133,
  2023: 1485 };  
var treeNum = treeMapping[endYear] || 100;
print('Number of Trees:', treeNum);
var rf = ee.Classifier.smileRandomForest({numberOfTrees:treeNum, bagFraction:0.6}).train(training, 'landslide', bandNames)
.setOutputMode('PROBABILITY');
var rfclass = combinedLSMFactors.select(bandNames).classify(rf);
Map.addLayer(rfclass, {min: 0, max: 1, palette: ['white', 'red']}, 'Probability Mapping');
var susceptibility_slices = rfclass.where(rfclass.lt(0.25), 1)    // Very Low - Dark Green
  .where(rfclass.gte(0.25).and(rfclass.lt(0.4)), 2)   // Low - Olive Green
  .where(rfclass.gte(0.4).and(rfclass.lt(0.5)), 3)    // Moderate - Yellow
  .where(rfclass.gte(0.5).and(rfclass.lte(1)), 4);    // High - Red
var palette = ['green', 'lightgreen', 'yellow', 'red'];
Map.addLayer(susceptibility_slices.clip(wayanad), {min: 1, max: 4, palette: palette}, 'Reclassified Susceptibility Levels');
var classifiedLSMInteger = susceptibility_slices.toInt();
var smoothedClassifiedLSM = classifiedLSMInteger.reduceNeighborhood({
  reducer: ee.Reducer.mode(),
  kernel: ee.Kernel.square(3)  // 3x3 kernel size for smoothing
});
var dilatedLSM = smoothedClassifiedLSM.focal_max({radius: 1, kernelType: 'square'});
var erodedLSM = dilatedLSM.focal_min({radius: 1, kernelType: 'square'});
var LSMRegions = erodedLSM.reduceToVectors({
  reducer: ee.Reducer.countEvery(),
  geometryType: 'polygon',
  scale: 30,  // Increased scale to reduce computation
  maxPixels: 1e8,  // Increased maxPixels
  geometry: wayanad
});
var simplifiedRegions = LSMRegions.map(function (feature) {
  return feature.simplify(30); // Higher tolerance for simplification
});
var filteredRegions = simplifiedRegions.filter(ee.Filter.gt('count', 50)); // Lower threshold for small regions
var rasterizedRegions = filteredRegions.reduceToImage({
  properties: ['label'],
  reducer: ee.Reducer.first()
});
Map.addLayer(rasterizedRegions.clip(wayanad), 
  {min: 1, max: 4, palette: ['green', 'lightgreen', 'yellow', 'red']}, 
  'LSM Smooth Region-Based');