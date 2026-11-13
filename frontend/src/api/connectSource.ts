/**
 * Raw URL of repo-root connect.json on the default branch, without a query string.
 * Example: https://raw.githubusercontent.com/<owner>/<repo>/<branch>/connect.json
 *
 * Empty when this checkout has no GitHub remote. The page still requests /connect.json
 * on the host that served the frontend. After a remote exists, set this constant,
 * deploy the frontend once, and later tunnel changes only need a pushed connect.json.
 */
export const GITHUB_CONNECT_RAW = "https://raw.githubusercontent.com/gabo2212/lingo-translator/master/connect.json";
