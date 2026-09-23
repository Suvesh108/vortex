package io.vortexdownloader.app;

import android.annotation.SuppressLint;
import android.app.Activity;
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
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;
import android.webkit.CookieManager;
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
import android.widget.Toast;

public class InbuiltBrowserActivity extends Activity {

    private WebView webView;
    private EditText urlInput;
    private ProgressBar progressBar;
    private Button downloadFab;
    private LinearLayout mainLayout;
    private FrameLayout customViewContainer;
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    private String detectedMediaUrl = null;
    private String currentLoadedUrl = "";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Root container (Dark theme)
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#121214"));

        mainLayout = new LinearLayout(this);
        mainLayout.setOrientation(LinearLayout.VERTICAL);
        mainLayout.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // 1. Top Navigation Bar (Height 52dp, Background #18181b)
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
            if (webView != null && webView.canGoForward()) {
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

        // Dedicated "⚡ Add" Button in top bar
        Button addBtn = new Button(this);
        addBtn.setText("⚡ Add");
        addBtn.setTextColor(Color.WHITE);
        addBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        addBtn.setTypeface(Typeface.SANS_SERIF, Typeface.BOLD);
        GradientDrawable addBg = new GradientDrawable();
        addBg.setColor(Color.parseColor("#0284c7"));
        addBg.setCornerRadius(dpToPx(12));
        addBtn.setBackground(addBg);
        addBtn.setPadding(dpToPx(10), 0, dpToPx(10), 0);
        LinearLayout.LayoutParams addParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                dpToPx(34)
        );
        addParams.setMargins(dpToPx(2), 0, dpToPx(4), 0);
        addBtn.setOnClickListener(v -> handleDownloadCurrent());
        topBar.addView(addBtn, addParams);

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

        // 3. Isolated WebView
        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#121214"));
        LinearLayout.LayoutParams webParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        );
        mainLayout.addView(webView, webParams);
        root.addView(mainLayout);

        // 4. Custom View Container for Fullscreen Video Playback
        customViewContainer = new FrameLayout(this);
        customViewContainer.setBackgroundColor(Color.BLACK);
        customViewContainer.setVisibility(View.GONE);
        root.addView(customViewContainer, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // 5. Floating Action Button: "⚡ Add to Vortex"
        downloadFab = new Button(this);
        downloadFab.setText("⚡ Add to Vortex");
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

        // Allow mixed HTTP/HTTPS content so streaming CDN chunks load without blockage
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Clean Modern Mobile User Agent
        s.setUserAgentString("Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36");

        // Isolated session cookies
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        // Intercept download link clicked in browser and queue in Vortex WITHOUT closing the browser!
        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            sendDownloadToVortexNonClosing(url);
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

            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (customView != null) {
                    onHideCustomView();
                    return;
                }
                customView = view;
                customViewCallback = callback;
                mainLayout.setVisibility(View.GONE);
                downloadFab.setVisibility(View.GONE);
                customViewContainer.addView(view);
                customViewContainer.setVisibility(View.VISIBLE);
                getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            }

            @Override
            public void onHideCustomView() {
                if (customView == null) return;
                mainLayout.setVisibility(View.VISIBLE);
                downloadFab.setVisibility(View.VISIBLE);
                customViewContainer.removeView(customView);
                customViewContainer.setVisibility(View.GONE);
                customView = null;
                if (customViewCallback != null) {
                    customViewCallback.onCustomViewHidden();
                    customViewCallback = null;
                }
                getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            }
        });

        // Long click to capture any link, image, or media stream
        webView.setOnLongClickListener(v -> {
            WebView.HitTestResult result = webView.getHitTestResult();
            if (result != null) {
                int type = result.getType();
                if (type == WebView.HitTestResult.SRC_ANCHOR_TYPE ||
                    type == WebView.HitTestResult.SRC_IMAGE_ANCHOR_TYPE ||
                    type == WebView.HitTestResult.IMAGE_TYPE) {
                    String extra = result.getExtra();
                    if (!TextUtils.isEmpty(extra) && (extra.startsWith("http://") || extra.startsWith("https://") || extra.startsWith("magnet:?"))) {
                        sendDownloadToVortexNonClosing(extra);
                        return true;
                    }
                }
            }
            return false;
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String u = request.getUrl().toString();
                String lower = u.toLowerCase();
                if (lower.startsWith("magnet:?") || lower.startsWith("ftp://") || lower.startsWith("ed2k://")) {
                    sendDownloadToVortexNonClosing(u);
                    return true;
                }
                if (isDownloadableFile(lower)) {
                    sendDownloadToVortexNonClosing(u);
                    return true;
                }
                return false;
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String u = request.getUrl().toString().toLowerCase();
                // Filter out tiny 2-second video fragments (.ts, .m4s) from overriding master playlists
                if (u.contains(".m3u8") || u.contains("/master.") || u.contains("/playlist.") ||
                    u.contains(".mp4") || u.contains(".webm") || u.contains(".mkv") ||
                    u.contains(".mp3") || u.contains(".m4a")) {
                    
                    if (!u.contains(".ts") && !u.contains(".m4s")) {
                        detectedMediaUrl = request.getUrl().toString();
                        runOnUiThread(() -> {
                            downloadFab.setText("🎥 Download Video (" + getExt(detectedMediaUrl) + ")");
                            downloadFab.setBackgroundColor(Color.parseColor("#22c55e"));
                        });
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                currentLoadedUrl = url;
                urlInput.setText(url);
                injectMediaSnifferScript();
            }
        });

        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void onMediaDetected(String src) {
                if (!TextUtils.isEmpty(src) && src.startsWith("http")) {
                    detectedMediaUrl = src;
                    runOnUiThread(() -> {
                        downloadFab.setText("🎥 Download Media Stream");
                        downloadFab.setBackgroundColor(Color.parseColor("#22c55e"));
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
                "      if (s && s.startsWith('http') && !s.includes('.ts') && !s.includes('.m4s')) {" +
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
            targetUrl = "https://duckduckgo.com/?q=" + Uri.encode(trimmed);
        }

        currentLoadedUrl = targetUrl;
        urlInput.setText(targetUrl);
        webView.loadUrl(targetUrl);
    }

    private void handleDownloadCurrent() {
        String urlToDownload = null;
        if (!TextUtils.isEmpty(detectedMediaUrl)) {
            urlToDownload = detectedMediaUrl;
        } else if (webView != null && !TextUtils.isEmpty(webView.getUrl()) && !webView.getUrl().equals("about:blank")) {
            urlToDownload = webView.getUrl();
        } else if (!TextUtils.isEmpty(currentLoadedUrl) && !currentLoadedUrl.equals("about:blank")) {
            urlToDownload = currentLoadedUrl;
        } else if (urlInput != null && !TextUtils.isEmpty(urlInput.getText())) {
            urlToDownload = urlInput.getText().toString().trim();
        }

        if (TextUtils.isEmpty(urlToDownload) || urlToDownload.equals("about:blank")) {
            Toast.makeText(this, "No active link or media found to add", Toast.LENGTH_SHORT).show();
            return;
        }
        sendDownloadToVortexNonClosing(urlToDownload);
    }

    private boolean isDownloadableFile(String url) {
        String clean = url.split("\\?")[0];
        return clean.endsWith(".apk") || clean.endsWith(".zip") || clean.endsWith(".rar") ||
               clean.endsWith(".7z") || clean.endsWith(".tar") || clean.endsWith(".gz") ||
               clean.endsWith(".iso") || clean.endsWith(".exe") || clean.endsWith(".msi") ||
               clean.endsWith(".mp4") || clean.endsWith(".mkv") || clean.endsWith(".avi") ||
               clean.endsWith(".mov") || clean.endsWith(".mp3") || clean.endsWith(".flac") ||
               clean.endsWith(".wav") || clean.endsWith(".m3u8") || clean.endsWith(".pdf");
    }

    /**
     * Send download URL to Vortex queue while keeping the browser open!
     */
    private void sendDownloadToVortexNonClosing(String url) {
        InbuiltBrowserPlugin.emitDownloadRequested(url);
        Toast.makeText(this, "⚡ Added to Vortex Download Queue!", Toast.LENGTH_SHORT).show();
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
        if (customView != null) {
            if (webView != null && webView.getWebChromeClient() != null) {
                webView.getWebChromeClient().onHideCustomView();
            }
            return;
        }
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
