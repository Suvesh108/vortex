package io.vortexdownloader.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public class InbuiltBrowserActivity extends Activity {

    private WebView webView;
    private EditText urlInput;
    private ProgressBar progressBar;
    private Button downloadFab;
    private String detectedMediaUrl = null;
    private String currentLoadedUrl = "";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Root container (Dark theme)
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#121214"));

        LinearLayout mainLayout = new LinearLayout(this);
        mainLayout.setOrientation(LinearLayout.VERTICAL);
        mainLayout.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // 1. Top Navigation Bar (Height 54dp, Background #18181b)
        LinearLayout topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.HORIZONTAL);
        topBar.setBackgroundColor(Color.parseColor("#18181b"));
        topBar.setGravity(Gravity.CENTER_VERTICAL);
        int pad = dpToPx(6);
        topBar.setPadding(pad, pad, pad, pad);
        LinearLayout.LayoutParams topBarParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dpToPx(52)
        );
        mainLayout.addView(topBar, topBarParams);

        // Back Button
        Button backBtn = createNavButton("◀", Color.parseColor("#3ea6ff"));
        backBtn.setOnClickListener(v -> {
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
            }
        });
        topBar.addView(backBtn);

        // Forward Button
        Button fwdBtn = createNavButton("▶", Color.parseColor("#a1a1aa"));
        fwdBtn.setOnClickListener(v -> {
            if (webView != null && webView.canGoBack()) {
                webView.goForward();
            }
        });
        topBar.addView(fwdBtn);

        // Refresh Button
        Button reloadBtn = createNavButton("↻", Color.parseColor("#a1a1aa"));
        reloadBtn.setOnClickListener(v -> {
            if (webView != null) {
                webView.reload();
            }
        });
        topBar.addView(reloadBtn);

        // Address & Search Bar
        urlInput = new EditText(this);
        urlInput.setSingleLine(true);
        urlInput.setImeOptions(EditorInfo.IME_ACTION_GO);
        urlInput.setTextColor(Color.parseColor("#ffffff"));
        urlInput.setHintTextColor(Color.parseColor("#71717a"));
        urlInput.setHint("Search or enter URL...");
        urlInput.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        urlInput.setTypeface(Typeface.SANS_SERIF);
        urlInput.setPadding(dpToPx(12), dpToPx(6), dpToPx(12), dpToPx(6));

        GradientDrawable urlBg = new GradientDrawable();
        urlBg.setColor(Color.parseColor("#27272a"));
        urlBg.setCornerRadius(dpToPx(14));
        urlBg.setStroke(dpToPx(1), Color.parseColor("#3f3f46"));
        urlInput.setBackground(urlBg);

        LinearLayout.LayoutParams urlParams = new LinearLayout.LayoutParams(
                0,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                1.0f
        );
        urlParams.setMargins(dpToPx(4), 0, dpToPx(4), 0);
        topBar.addView(urlInput, urlParams);

        urlInput.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_GO ||
                actionId == EditorInfo.IME_ACTION_SEARCH ||
                (event != null && event.getKeyCode() == KeyEvent.KEYCODE_ENTER && event.getAction() == KeyEvent.ACTION_DOWN)) {
                navigateTo(urlInput.getText().toString());
                return true;
            }
            return false;
        });

        // Close / Exit Button
        Button closeBtn = createNavButton("✕", Color.parseColor("#ef4444"));
        closeBtn.setOnClickListener(v -> finish());
        topBar.addView(closeBtn);

        // 2. Loading Progress Bar
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setProgress(0);
        LinearLayout.LayoutParams progressParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dpToPx(3)
        );
        mainLayout.addView(progressBar, progressParams);

        // 3. Isolated WebView (Standalone private profile - NO Gmail auto-sync)
        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#121214"));
        LinearLayout.LayoutParams webParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        );
        mainLayout.addView(webView, webParams);
        root.addView(mainLayout);

        // 4. Floating Action Button: "⚡ Download with Vortex"
        downloadFab = new Button(this);
        downloadFab.setText("⚡ Download Media");
        downloadFab.setTextColor(Color.BLACK);
        downloadFab.setTypeface(Typeface.SANS_SERIF, Typeface.BOLD);
        downloadFab.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        int fabPadH = dpToPx(16);
        int fabPadV = dpToPx(10);
        downloadFab.setPadding(fabPadH, fabPadV, fabPadH, fabPadV);

        GradientDrawable fabBg = new GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                new int[]{Color.parseColor("#3ea6ff"), Color.parseColor("#38bdf8")}
        );
        fabBg.setCornerRadius(dpToPx(24));
        fabBg.setStroke(dpToPx(1), Color.WHITE);
        downloadFab.setBackground(fabBg);
        downloadFab.setElevation(dpToPx(8));

        FrameLayout.LayoutParams fabParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        fabParams.gravity = Gravity.BOTTOM | Gravity.END;
        fabParams.setMargins(0, 0, dpToPx(16), dpToPx(20));
        downloadFab.setOnClickListener(v -> handleDownloadCurrent());
        root.addView(downloadFab, fabParams);

        setContentView(root);

        // Configure Isolated WebSettings
        configureWebSettings();

        // Initial URL
        String targetUrl = getIntent().getStringExtra("url");
        if (TextUtils.isEmpty(targetUrl)) {
            targetUrl = "https://duckduckgo.com";
        }
        navigateTo(targetUrl);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebSettings() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setSupportZoom(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setMediaPlaybackRequiresUserGesture(false);

        // Clean Modern Mobile User Agent (Independent from Chrome account / Gmail sync)
        s.setUserAgentString("Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36");

        // Isolated session cookies (allow browsing and logins without sharing device's personal Gmail profile)
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        // Intercept any download link clicked in browser and send to Vortex
        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            Toast.makeText(InbuiltBrowserActivity.this, "Transferring download to Vortex...", Toast.LENGTH_SHORT).show();
            returnDownloadToVortex(url);
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress >= 100) {
                    progressBar.setVisibility(View.GONE);
                } else {
                    progressBar.setVisibility(View.VISIBLE);
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String u = request.getUrl().toString();
                if (u.startsWith("http://") || u.startsWith("https://")) {
                    return false; // let webview load it internally
                }
                // Check magnet / ftp / ed2k links -> send directly to Vortex Downloader!
                if (u.startsWith("magnet:?") || u.startsWith("ftp://") || u.startsWith("ed2k://")) {
                    returnDownloadToVortex(u);
                    return true;
                }
                return false;
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String u = request.getUrl().toString().toLowerCase();
                // Real-time media sniffer
                if (u.contains(".m3u8") || u.contains(".mp4") || u.contains(".webm") ||
                    u.contains(".ts") || u.contains("/master.m3u8") || u.contains("/playlist.m3u8") ||
                    u.contains(".m4s") || u.contains(".mp3") || u.contains(".m4a")) {
                    detectedMediaUrl = request.getUrl().toString();
                    runOnUiThread(() -> {
                        downloadFab.setText("🎥 Download Video (" + getExt(detectedMediaUrl) + ")");
                        downloadFab.setBackgroundColor(Color.parseColor("#22c55e"));
                    });
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                currentLoadedUrl = url;
                urlInput.setText(url);

                // Inject client-side media scraper for HTML5 video/audio elements
                injectMediaSnifferScript();
            }
        });

        // Add JavaScript bridge for media detection
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void onMediaDetected(String src) {
                if (!TextUtils.isEmpty(src) && src.startsWith("http")) {
                    detectedMediaUrl = src;
                    runOnUiThread(() -> {
                        downloadFab.setText("🎥 Download Media Stream");
                    });
                }
            }
        }, "VortexSniffer");
    }

    private void injectMediaSnifferScript() {
        String js = "javascript:(function() {" +
                "  function check() {" +
                "    var tags = document.querySelectorAll('video, audio, source');" +
                "    for (var i = 0; i < tags.length; i++) {" +
                "      var s = tags[i].src || tags[i].getAttribute('src');" +
                "      if (s && s.startsWith('http')) {" +
                "        window.VortexSniffer && window.VortexSniffer.onMediaDetected(s);" +
                "      }" +
                "    }" +
                "  }" +
                "  check();" +
                "  setInterval(check, 3000);" +
                "})();";
        webView.evaluateJavascript(js, null);
    }

    private void navigateTo(String input) {
        String trimmed = input.trim();
        if (TextUtils.isEmpty(trimmed)) return;

        String targetUrl;
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            targetUrl = trimmed;
        } else if (trimmed.contains(".") && !trimmed.contains(" ")) {
            targetUrl = "https://" + trimmed;
        } else {
            // Private search via DuckDuckGo (No Google tracking / Gmail login)
            targetUrl = "https://duckduckgo.com/?q=" + Uri.encode(trimmed);
        }

        currentLoadedUrl = targetUrl;
        urlInput.setText(targetUrl);
        webView.loadUrl(targetUrl);
    }

    private void handleDownloadCurrent() {
        String urlToDownload = !TextUtils.isEmpty(detectedMediaUrl) ? detectedMediaUrl : currentLoadedUrl;
        if (TextUtils.isEmpty(urlToDownload)) {
            Toast.makeText(this, "No active page or media stream found", Toast.LENGTH_SHORT).show();
            return;
        }
        returnDownloadToVortex(urlToDownload);
    }

    private void returnDownloadToVortex(String url) {
        Intent resultIntent = new Intent();
        resultIntent.putExtra("downloadUrl", url);
        setResult(Activity.RESULT_OK, resultIntent);
        finish();
    }

    private Button createNavButton(String label, int textColor) {
        Button btn = new Button(this);
        btn.setText(label);
        btn.setTextColor(textColor);
        btn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        btn.setBackgroundColor(Color.TRANSPARENT);
        int p = dpToPx(8);
        btn.setPadding(p, 0, p, 0);
        btn.setLayoutParams(new LinearLayout.LayoutParams(
                dpToPx(38),
                dpToPx(38)
        ));
        return btn;
    }

    private String getExt(String url) {
        try {
            String clean = url.split("\\?")[0];
            int dot = clean.lastIndexOf('.');
            if (dot != -1 && dot < clean.length() - 1) {
                return clean.substring(dot + 1).toUpperCase();
            }
        } catch (Exception ignored) {}
        return "STREAM";
    }

    private int dpToPx(int dp) {
        return (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                dp,
                getResources().getDisplayMetrics()
        );
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
