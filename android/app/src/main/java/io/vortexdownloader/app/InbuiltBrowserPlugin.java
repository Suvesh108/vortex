package io.vortexdownloader.app;

import android.app.Activity;
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

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url", "https://duckduckgo.com");
        Intent intent = new Intent(getActivity(), InbuiltBrowserActivity.class);
        intent.putExtra("url", url);
        startActivityForResult(call, intent, "browserResult");
    }

    @ActivityCallback
    private void browserResult(PluginCall call, ActivityResult result) {
        if (result != null && result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            String downloadUrl = result.getData().getStringExtra("downloadUrl");
            if (downloadUrl != null && !downloadUrl.isEmpty()) {
                JSObject ret = new JSObject();
                ret.put("downloadUrl", downloadUrl);
                notifyListeners("onDownloadRequested", ret);
                call.resolve(ret);
                return;
            }
        }
        JSObject empty = new JSObject();
        empty.put("closed", true);
        call.resolve(empty);
    }
}
