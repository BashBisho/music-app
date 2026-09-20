const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withBackgroundActions(config) {
    return withAndroidManifest(config, config => {
        const application = config.modResults.manifest.application[0];
        const serviceName = "com.asterinet.react.bgactions.RNBackgroundActionsTask";

        application.service = application.service || [];

        const service = application.service.find(
            s => s.$?.["android:name"] === serviceName
        );

        if (service) {
            service.$["android:foregroundServiceType"] = "mediaPlayback";
            service.$["android:exported"] = "false";
        } else {
            application.service.push({
                $: {
                    "android:name": serviceName,
                    "android:foregroundServiceType": "mediaPlayback",
                    "android:exported": "false"
                }
            });
        }

        return config;
    });
};