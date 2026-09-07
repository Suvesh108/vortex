package io.vortexdownloader.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String downloadUrl = call.getString("url");
        if (downloadUrl == null || downloadUrl.isEmpty()) {
            call.reject("url parameter is required");
            return;
        }

        new Thread(() -> {
            try {
                URL url = new URL(downloadUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 VortexDownloader-AppUpdater");
                conn.connect();

                // Handle redirects (GitHub releases 302 Found)
                int status = conn.getResponseCode();
                int redirectCount = 0;
                while ((status == HttpURLConnection.HTTP_MOVED_TEMP ||
                        status == HttpURLConnection.HTTP_MOVED_PERM ||
                        status == HttpURLConnection.HTTP_SEE_OTHER ||
                        status == 307 || status == 308) && redirectCount < 6) {
                    String newUrl = conn.getHeaderField("Location");
                    conn.disconnect();
                    url = new URL(newUrl);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setInstanceFollowRedirects(true);
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 VortexDownloader-AppUpdater");
                    conn.connect();
                    status = conn.getResponseCode();
                    redirectCount++;
                }

                if (status != HttpURLConnection.HTTP_OK) {
                    call.reject("Server returned HTTP " + status);
                    return;
                }

                long totalLength = conn.getContentLengthLong();
                InputStream input = conn.getInputStream();

                File cacheDir = getContext().getCacheDir();
                File outputFile = new File(cacheDir, "VortexDownloader-update.apk");
                if (outputFile.exists()) {
                    outputFile.delete();
                }

                FileOutputStream output = new FileOutputStream(outputFile);
                byte[] buffer = new byte[8192];
                int count;
                long total = 0;
                long lastNotifyTime = 0;

                while ((count = input.read(buffer)) != -1) {
                    total += count;
                    output.write(buffer, 0, count);

                    long now = System.currentTimeMillis();
                    if (now - lastNotifyTime > 120) {
                        int percent = totalLength > 0 ? (int) ((total * 100) / totalLength) : 0;
                        JSObject progressObj = new JSObject();
                        progressObj.put("percent", percent);
                        progressObj.put("downloadedBytes", total);
                        progressObj.put("totalBytes", totalLength);
                        notifyListeners("updateProgress", progressObj);
                        lastNotifyTime = now;
                    }
                }

                output.flush();
                output.close();
                input.close();
                conn.disconnect();

                // Final 100% notification
                JSObject finalProgress = new JSObject();
                finalProgress.put("percent", 100);
                finalProgress.put("downloadedBytes", total);
                finalProgress.put("totalBytes", total);
                notifyListeners("updateProgress", finalProgress);

                // Prompt user to enable unknown sources if needed on Oreo+
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    if (!getContext().getPackageManager().canRequestPackageInstalls()) {
                        Intent settingsIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                        settingsIntent.setData(Uri.parse("package:" + getContext().getPackageName()));
                        settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(settingsIntent);
                    }
                }

                // Launch package installer via FileProvider
                Uri apkUri;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    apkUri = FileProvider.getUriForFile(
                        getContext(),
                        getContext().getPackageName() + ".fileprovider",
                        outputFile
                    );
                } else {
                    apkUri = Uri.fromFile(outputFile);
                }

                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("filePath", outputFile.getAbsolutePath());
                call.resolve(res);

            } catch (Exception e) {
                call.reject("Download/install failed: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void installApk(PluginCall call) {
        String filePath = call.getString("filePath");
        if (filePath == null || filePath.isEmpty()) {
            call.reject("filePath parameter is required");
            return;
        }

        try {
            if (filePath.startsWith("file://")) {
                filePath = filePath.substring(7);
            }

            File apkFile = new File(filePath);
            if (!apkFile.exists()) {
                call.reject("APK file does not exist at: " + filePath);
                return;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!getContext().getPackageManager().canRequestPackageInstalls()) {
                    Intent settingsIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                    settingsIntent.setData(Uri.parse("package:" + getContext().getPackageName()));
                    settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(settingsIntent);
                }
            }

            Uri apkUri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                apkUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    apkFile
                );
            } else {
                apkUri = Uri.fromFile(apkFile);
            }

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            getContext().startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "Package installer launched successfully");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to trigger Android package installer: " + e.getMessage());
        }
    }
}
