function contains<T>(arr: T[], predicat: (el: T) => boolean): boolean {
  for (let i = 0, len = arr.length; i < len; i++) {
    if (predicat(arr[i])) {
      return true;
    }
  }

  return false;
}

export default contains;
