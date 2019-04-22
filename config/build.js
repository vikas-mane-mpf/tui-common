{
  baseUrl: "../",
  paths:{
      "app": "src/main",
      "common": "src",
      "components": "src/components",
      
      jquery: "empty:",
      underscore: "empty:",
      backbone: "empty:",
      jstorage: "empty:",
      i18next: "empty:",
      jqueryFileDownLoader: "empty:",
      moment: "empty:",
      numeral: "empty:",
      d3: "empty:",
      jqueryUI: "empty:",

      "modules/audienceDiscovery/collections/RelevancyCollection": "empty:",
      "modules/audienceDiscovery/collections/DeviceBreakdownCollection": "empty:",
      "modules/audienceDiscovery/collections/CarrierBreakdownCollection": "empty:",
      "modules/tags/util/Util": "empty:",
      "modules/home/utils/utils": "empty:"
  },
  include:["app"],
  out: "../dist/main.js",
  generateSourceMaps: true,
  optimize: "none"
}