import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['b39f002e93904f10153ffdc9dd03d654'],
    table: 'sys_script_email',
    data: {
        name: 'sugboclean_pickup_reminder_details',
        new_lines_to_html: false,
        script: `(function runMailScript(current, template, email, email_action, event) {
      var schedule = new GlideRecord('x_1986056_sugbocle_schedule');
      if (event.parm2 && schedule.get(event.parm2)) {
          template.print('<p><strong>Time window:</strong> ' +
              schedule.getDisplayValue('u_time_window_start') + ' – ' +
              schedule.getDisplayValue('u_time_window_end') + '</p>');
          template.print('<p><strong>Hauler:</strong> ' +
              schedule.getDisplayValue('u_hauler') + '</p>');
          template.print('<p><strong>Waste type:</strong> ' +
              schedule.getValue('u_waste_type') + '</p>');
      }
  })(current, template, email, email_action, event);`,
    },
})
