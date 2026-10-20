package com.ronsmoney.app;

import android.content.Context;
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

@CapacitorPlugin(name = "AppInstaller")
public class AppInstallerPlugin extends Plugin {

    @PluginMethod
    public void canRequestPackageInstalls(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                boolean canInstall = getContext().getPackageManager().canRequestPackageInstalls();
                ret.put("canInstall", canInstall);
            } else {
                ret.put("canInstall", true);
            }
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("canInstall", true);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("No se pudo abrir la pantalla de configuración: " + e.getMessage());
        }
    }

    @PluginMethod
    public void installApkFromUrl(PluginCall call) {
        String downloadUrl = call.getString("url");
        if (downloadUrl == null || downloadUrl.trim().isEmpty()) {
            call.reject("URL de descarga vacía o no válida");
            return;
        }

        new Thread(() -> {
            try {
                Context context = getContext();
                URL url = new URL(downloadUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(25000);
                conn.setReadTimeout(35000);
                conn.setInstanceFollowRedirects(true);
                conn.connect();

                // Handle HTTP redirects (e.g., 301, 302, 307 from GitHub release assets)
                int status = conn.getResponseCode();
                if (status == HttpURLConnection.HTTP_MOVED_TEMP || 
                    status == HttpURLConnection.HTTP_MOVED_PERM || 
                    status == 307 || status == 308) {
                    String newUrl = conn.getHeaderField("Location");
                    conn.disconnect();
                    url = new URL(newUrl);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(25000);
                    conn.setReadTimeout(35000);
                    conn.connect();
                }

                int fileLength = conn.getContentLength();

                File dir = context.getExternalCacheDir() != null ? context.getExternalCacheDir() : context.getCacheDir();
                File apkFile = new File(dir, "update.apk");
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                InputStream input = conn.getInputStream();
                FileOutputStream output = new FileOutputStream(apkFile);

                byte[] buffer = new byte[8192];
                long total = 0;
                int count;
                long lastProgressTime = 0;

                while ((count = input.read(buffer)) != -1) {
                    total += count;
                    output.write(buffer, 0, count);

                    long now = System.currentTimeMillis();
                    if (fileLength > 0 && (now - lastProgressTime > 250)) {
                        lastProgressTime = now;
                        int percent = (int) ((total * 100) / fileLength);
                        JSObject progress = new JSObject();
                        progress.put("percent", percent);
                        progress.put("loaded", total);
                        progress.put("total", fileLength);
                        notifyListeners("downloadProgress", progress);
                    }
                }

                output.flush();
                output.close();
                input.close();
                conn.disconnect();

                // Notify 100% completion
                JSObject progress = new JSObject();
                progress.put("percent", 100);
                progress.put("loaded", total);
                progress.put("total", total);
                notifyListeners("downloadProgress", progress);

                // Directly launch the Android package installer
                launchInstallerIntent(apkFile, call);

            } catch (Exception e) {
                call.reject("Error al descargar e instalar el archivo APK: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void installApkFromBase64(PluginCall call) {
        String base64Data = call.getString("base64");
        if (base64Data == null || base64Data.trim().isEmpty()) {
            call.reject("Datos Base64 no proporcionados");
            return;
        }

        try {
            Context context = getContext();
            File dir = context.getExternalCacheDir() != null ? context.getExternalCacheDir() : context.getCacheDir();
            File apkFile = new File(dir, "update.apk");
            if (apkFile.exists()) {
                apkFile.delete();
            }

            // Remove data URI prefix if present
            if (base64Data.contains(",")) {
                base64Data = base64Data.split(",")[1];
            }

            byte[] decoded = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT);
            FileOutputStream fos = new FileOutputStream(apkFile);
            fos.write(decoded);
            fos.flush();
            fos.close();

            launchInstallerIntent(apkFile, call);
        } catch (Exception e) {
            call.reject("Error al procesar el archivo APK: " + e.getMessage());
        }
    }

    private void launchInstallerIntent(File apkFile, PluginCall call) {
        try {
            Context context = getContext();
            Uri apkUri = FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                apkFile
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            context.startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error al ejecutar el instalador del sistema: " + e.getMessage());
        }
    }
}
