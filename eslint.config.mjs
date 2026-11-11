import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Third-party code installed by the shadcn CLI (React Bits). It is kept
    // as installed; it syncs its props into a ref during render on purpose.
    files: ["components/vendor/**"],
    rules: { "react-hooks/refs": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);

export default eslintConfig;
