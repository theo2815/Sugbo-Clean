(function executeRule(current, previous /*null when insert*/) {

    // Get the current year
    var year = new GlideDateTime().getYearLocalTime();

    // Count existing reports to generate next number
    var ga = new GlideAggregate('x_1986056_sugbocle_report');
    ga.addAggregate('COUNT');
    ga.query();

    var count = 0;
    if (ga.next()) {
        count = parseInt(ga.getAggregate('COUNT')) + 1;
    } else {
        count = 1;
    }

    // Format as SC-2026-0001
    var padded = ('0000' + count).slice(-4);
    current.u_report_code = 'SC-' + year + '-' + padded;

})(current, previous);