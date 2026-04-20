import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['b39f002e93904f10153ffdc9dd03d654'],
    table: 'sys_script_email',
    data: {
        name: 'sugboclean_pickup_reminder_details',
        new_lines_to_html: false,
        script: `(function runMailScript(current, template, email, email_action, event) {
      function formatManilaTime(raw) {
          if (!raw) return '';
          var m = String(raw).match(/(\\d{2}):(\\d{2})/);
          if (!m) return raw;
          var h = parseInt(m[1], 10);
          var min = parseInt(m[2], 10);
          var ampm = h >= 12 ? 'PM' : 'AM';
          var h12 = h % 12;
          if (h12 === 0) h12 = 12;
          var pad = function (n) { return (n < 10 ? '0' : '') + n; };
          return h12 + ':' + pad(min) + ' ' + ampm;
      }

      var schedule = new GlideRecord('x_1986056_sugbocle_schedule');
      if (event.parm2 && schedule.get(event.parm2)) {
          var startLocal = formatManilaTime(schedule.getValue('u_time_window_start'));
          var endLocal = formatManilaTime(schedule.getValue('u_time_window_end'));
          template.print('<p><strong>Time window:</strong> ' +
              startLocal + ' – ' + endLocal + ' PHT</p>');
          template.print('<p><strong>Hauler:</strong> ' +
              schedule.getDisplayValue('u_hauler') + '</p>');
          template.print('<p><strong>Waste type:</strong> ' +
              schedule.getValue('u_waste_type') + '</p>');
      }
  })(current, template, email, email_action, event);`,
    },
})
