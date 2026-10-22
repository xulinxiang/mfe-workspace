export function cx(...names: Array<string | false | undefined | null>) {
  return names.filter(Boolean).join(' ')
}
