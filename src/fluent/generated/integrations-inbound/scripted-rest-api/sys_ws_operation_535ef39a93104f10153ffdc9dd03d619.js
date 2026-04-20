(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
      var HTML_404 =
          '<!DOCTYPE html><html><head><title>Not Found</title>' +
          '<meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:60px auto;padding:24px;text-align:center;color:#1f2937}</style>' +
          '</head><body><h1>Not Found</h1>' +
          '<p>This unsubscribe link is not valid.</p></body></html>';

      response.setStatus(200); // HTML is served even on 404 paths below
      response.setHeader('Content-Type', 'text/html; charset=utf-8');

      var token = request.queryParams.token;
      if (token && token.length) token = token[0];

      if (!token) {
          response.setStatus(404);
          response.getStreamWriter().writeString(HTML_404);
          return;
      }

      var gr = new GlideRecord('x_1986056_sugbocle_reminder_subscription');
      gr.addQuery('u_unsubscribe_token', token);
      gr.setLimit(1);
      gr.query();

      if (!gr.next()) {
          response.setStatus(404);
          response.getStreamWriter().writeString(HTML_404);
          return;
      }

      if (gr.getValue('u_active') == '1' || gr.getValue('u_active') == 'true') {
          gr.setValue('u_active', false);
          gr.update();
      }

      var ok =
          '<!DOCTYPE html><html><head><title>Unsubscribed — SugboClean</title>' +
          '<meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:60px auto;padding:24px;text-align:center;color:#1f2937}h1{color:#16A34A;margin-bottom:8px}p{color:#4b5563}.muted{color:#9ca3af;font-size:13px;margin-top:32px}</style>' +
          '</head><body><h1>You\'ve been unsubscribed</h1>' +
          '<p>You will no longer receive pickup reminder emails from SugboClean.</p>' +
          '<p class="muted">Keeping Sugbo clean, one pickup at a time.</p>' +
          '</body></html>';
      response.getStreamWriter().writeString(ok);
  })(request, response);