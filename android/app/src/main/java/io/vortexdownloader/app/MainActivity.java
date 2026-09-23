package io.vortexdownloader.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppUpdaterPlugin.class);
        registerPlugin(InbuiltBrowserPlugin.class);
        registerPlugin(VortexNativePlugin.class);
        super.onCreate(savedInstanceState);

        handleIncomingShareIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingShareIntent(intent);
    }

    private void handleIncomingShareIntent(Intent intent) {
        if (intent != null && Intent.ACTION_SEND.equals(intent.getAction())) {
            String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (sharedText != null && !sharedText.trim().isEmpty()) {
                VortexNativePlugin.pendingSharedUrl = sharedText.trim();
                if (getBridge() != null) {
                    com.getcapacitor.JSObject data = new com.getcapacitor.JSObject();
                    data.put("url", sharedText.trim());
                    getBridge().triggerWindowJSEvent("onVortexSharedUrl", data.toString());
                }
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (getBridge() != null) {
            getBridge().triggerWindowJSEvent("onVortexBackButton", "{}");
        } else {
            super.onBackPressed();
        }
    }
}
