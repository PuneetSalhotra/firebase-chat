/**
 * author: SBK
 */
const FrequencyDistribution = require('./frequencyDistribution');
const SingleDimensionalAggr = require('./singleDimentionalAggr');
const MultiDimensionalAggr = require('./multiDimensionalAggr');
const MultiValueVisualization = require('./multiValueVisualization');


const CONST = require('../../constants');

exports.get = function (id, args) {
    let widgetInstance;
    switch(id) {
    case CONST.WIDGET_TYPE_IDS.FREQUENCY_DISTRIBUTION:
        widgetInstance = new FrequencyDistribution(args);
        break;
    case CONST.WIDGET_TYPE_IDS.SINGLE_DIMENSIONAL_AGGR:
        widgetInstance = new SingleDimensionalAggr(args);
        break;
    case CONST.WIDGET_TYPE_IDS.MULTI_DIMENSIONAL_AGGR:
        widgetInstance = new MultiDimensionalAggr(args);
        break;
    case CONST.WIDGET_TYPE_IDS.MULTI_VALUE_VISUALIZATION:
        widgetInstance = new MultiValueVisualization(args);
        break;
    default:
        break;
    }
    return widgetInstance;
}