import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['1b0d3bd693104f10153ffdc9dd03d658'],
    table: 'sys_script_email',
    data: {
        name: 'x_1986056_sugbocle_reminder_subscription_script_1',
        new_lines_to_html: false,
        script: `var schedule = new GlideRecord('x_1986056_sugbocle_schedule');
  if (event.parm2 && schedule.get(event.parm2)) {
      template.print('<p><strong>Time window:</strong> ' + schedule.getDisplayValue('u_time_window_start') + ' &ndash; ' +
  schedule.getDisplayValue('u_time_window_end') + '</p>');
      template.print('<p><strong>Hauler:</strong> ' + schedule.getDisplayValue('u_hauler') + '</p>');
      template.print('<p><strong>Waste type:</strong> ' + schedule.getValue('u_waste_type') + '</p>');
  }`,
    },
})
