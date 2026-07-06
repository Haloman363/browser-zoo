//B1 naming pass: label default-named functions from the distinctive strings they
//reference, attach all referenced strings as the function comment, and export a
//full function index for B2 prioritization.
//Run (headless): analyzeHeadless re zoo -import Gamefiles/zoo.exe \
//  -scriptPath tools/ghidra -postScript NameFromStrings.java re/functions.csv
//@category browser-zoo
import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.Data;
import ghidra.program.model.listing.Function;
import ghidra.program.model.symbol.Reference;
import ghidra.program.model.symbol.SourceType;

import java.io.File;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class NameFromStrings extends GhidraScript {

    @Override
    public void run() throws Exception {
        // function -> distinctive strings it references
        Map<Function, List<String>> byFunc = new HashMap<>();
        int strings = 0;
        for (Data data : currentProgram.getListing().getDefinedData(true)) {
            Object v = data.getValue();
            if (!(v instanceof String)) continue;
            String s = ((String) v).trim();
            if (s.length() < 12) continue;   // short strings are too generic to name from
            strings++;
            for (Reference ref : getReferencesTo(data.getAddress())) {
                Function f = getFunctionContaining(ref.getFromAddress());
                if (f != null) {
                    byFunc.computeIfAbsent(f, k -> new ArrayList<>()).add(s);
                }
            }
        }

        int renamed = 0;
        for (Map.Entry<Function, List<String>> e : byFunc.entrySet()) {
            Function f = e.getKey();
            List<String> refs = e.getValue();
            // keep every referenced string visible on the function (plate comment)
            StringBuilder c = new StringBuilder("strings:");
            for (int i = 0; i < Math.min(refs.size(), 8); i++) {
                c.append('\n').append(refs.get(i));
            }
            f.setComment(c.toString());
            // rename only functions Ghidra left with default FUN_ names
            if (f.getSymbol().getSource() != SourceType.DEFAULT) continue;
            String base = sanitize(refs.get(0));
            if (base.isEmpty()) continue;
            f.setName("str_" + base + "_" + f.getEntryPoint(), SourceType.ANALYSIS);
            renamed++;
        }

        // full function index for B2 target-picking
        String outPath = getScriptArgs().length > 0 ? getScriptArgs()[0] : "functions.csv";
        File out = new File(outPath);
        if (out.getParentFile() != null) out.getParentFile().mkdirs();
        try (PrintWriter w = new PrintWriter(out, "UTF-8")) {
            w.println("entry,name,size,stringRefs");
            for (Function f : currentProgram.getFunctionManager().getFunctions(true)) {
                List<String> refs = byFunc.get(f);
                w.println(f.getEntryPoint() + "," + csv(f.getName()) + ","
                        + f.getBody().getNumAddresses() + "," + (refs == null ? 0 : refs.size()));
            }
        }
        println("NameFromStrings: " + strings + " distinctive strings, "
                + byFunc.size() + " functions with string refs, " + renamed + " renamed. Index: " + outPath);
    }

    private static String sanitize(String s) {
        String r = s.toLowerCase().replaceAll("[^a-z0-9]+", "_").replaceAll("^_+|_+$", "");
        return r.length() > 40 ? r.substring(0, 40) : r;
    }

    private static String csv(String s) {
        return '"' + s.replace("\"", "\"\"") + '"';
    }
}
