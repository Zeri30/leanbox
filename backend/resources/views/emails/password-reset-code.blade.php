<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password reset code</title>
</head>
<body style="margin:0; padding:24px; background:#f3f5f4; font-family:Arial, Helvetica, sans-serif; color:#1a1f1d;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
        <tr>
            <td>
                <h1 style="margin:0 0 8px; font-size:20px; color:#16a34a;">Reset your password</h1>
                <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#4b5551;">
                    Use the code below to reset your {{ config('app.name') }} password.
                    It expires in {{ $ttlMinutes }} minutes.
                </p>
                <div style="text-align:center; margin:0 0 20px;">
                    <span style="display:inline-block; font-size:32px; font-weight:bold; letter-spacing:8px; color:#0f2e1f; background:#e7f6ee; border-radius:10px; padding:14px 20px;">
                        {{ $code }}
                    </span>
                </div>
                <p style="margin:0; font-size:13px; line-height:1.6; color:#6b7772;">
                    If you didn&rsquo;t request a password reset, you can safely ignore this email &mdash;
                    your password won&rsquo;t change.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
