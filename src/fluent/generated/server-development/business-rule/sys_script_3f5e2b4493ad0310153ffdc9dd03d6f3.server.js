(function executeRule(current, previous /*null when async*/) {
    new SugboGeminiClassifier().classifyAndUpdate(current.getUniqueValue());
})(current, previous);
