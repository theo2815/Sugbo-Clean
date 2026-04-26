import { ScheduledScript } from '@servicenow/sdk/core'

ScheduledScript({
    $id: Now.ID['8e2f91d893a04f10153ffdc9dd03d602'],
    name: 'SugboClean Chatbot Rate Limit Cleanup',
    active: true,
    frequency: 'periodically',
    executionInterval: { hours: 1 },
    script: `(function run() {
    // Drop expired rate-limit rows so the table doesn't grow unbounded.
    // Rows are bucketed per (ip, minute), so a 5-minute grace beyond window_end
    // is more than enough — anything older has no read traffic.
    var cutoff = new GlideDateTime();
    cutoff.addSeconds(-300);

    var gr = new GlideRecord('x_1986056_sugbocle_chatbot_rate_limit');
    gr.addQuery('u_window_end', '<', cutoff);
    gr.deleteMultiple();
})();`,
})
