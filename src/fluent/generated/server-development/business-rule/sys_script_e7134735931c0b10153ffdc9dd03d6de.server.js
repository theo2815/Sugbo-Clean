(function executeRule(current, previous) {
    if (!current.u_schedule) return;
    var sg = new GlideRecord('x_1986056_sugbocle_schedule');
    if (sg.get(current.u_schedule.toString())) {
        current.u_hauler = sg.getValue('u_hauler');
    }
})(current, previous);