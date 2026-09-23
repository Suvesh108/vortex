package io.vortexdownloader.app;

import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "InbuiltBrowser")
public class InbuiltBrowserPlugin extends Plugin {

    private static InbuiltBrowserPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static void emitDownloadRequested(String downloadUrl) {
        if (instance != null && downloadUrl != null && !downloadUrl.isEmpty()) {
            JSObject ret = new JSObject();
            ret.put("downloadUrl", downloadUrl);
            instance.notifyListeners("onDownloadRequested", ret);
        }
    }

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url", "https://duckduckgo.com");
        Intent intent = new Intent(getActivity(), InbuiltBrowserActivity.class);
        intent.putExtra("url", url);
        startActivityForResult(call, intent, "browserResult");
    }

    @ActivityCallback
    private void browserResult(PluginCall call, ActivityResult result) {
        JSObject empty = new JSObject();
        empty.put("closed", true);
        call.resolve(empty);
    }
}
