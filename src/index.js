function isNum(num) {
  if (typeof num === 'number') {
    return true
  } else {
    return false
  }
}

function isNum2(num) {
  // 特地占位，可以看到覆盖率
  if (typeof num === 'number') {
    return true
  } else {
    return false
  }
}

exports.isNum = isNum;
exports.isNum2 = isNum2;