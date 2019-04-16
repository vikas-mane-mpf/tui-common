const path = require("path")
const UglifyJsPlugin = require("uglifyjs-webpack-plugin")
const glob = require("glob")

module.exports = {
    mode: "development",
    context: path.resolve(__dirname, '../src'),
    entry: {
        "bundle.js": glob.sync("./src/**/**.?(js|css)").map(f => path.resolve("./", f)),
    },
    output: {
        filename: "bundle.min.js",
    },
    externals:{
        "jquery": "jquery",
        "moment": "moment",
        "underscore": "_",
        "numeral": "numeral",
        "backbone": "Backbone",
        "i18next": "i18next",
        "jstorage":"jstorage",
        "jqueryUI": "jqueryUI",
        "jqueryFileDownLoader":"jqueryFileDownLoader",
        "d3": "d3",
        "modules/audienceDiscovery/collections/CarrierBreakdownCollection": "modules/audienceDiscovery/collections/CarrierBreakdownCollection",
        "modules/audienceDiscovery/collections/RelevancyCollection": "modules/audienceDiscovery/collections/RelevancyCollection",
        "modules/audienceDiscovery/collections/DeviceBreakdownCollection": "modules/audienceDiscovery/collections/DeviceBreakdownCollection",
        "modules/tags/util/Util": "modules/tags/util/Util",
        "modules/home/utils/utils": "modules/home/utils/utils"
    },
    plugins: [new UglifyJsPlugin()],
    resolve:{
        alias:{
            "main": path.resolve("./src"),
            "components": path.resolve("./src/components")
        }
    }
}