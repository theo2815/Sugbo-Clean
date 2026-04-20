(function executeRule(current, previous /*null when async*/) {
      if (!current.u_unsubscribe_token) {
          current.u_unsubscribe_token = gs.generateGUID();
      }
  })(current, previous);