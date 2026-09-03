import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Calculator, Eraser, FlaskConical } from "lucide-react";

import { explainManual, predictManual } from "@/lib/api";
import {
  CATEGORICAL_FIELDS,
  EMPTY_PAYLOAD,
  EXAMPLE_PAYLOAD,
  NUMERIC_FIELDS,
  prettyAge,
  prettyOption,
  type CategoricalFeatureKey,
  type Explanation,
  type FeaturePayload,
  type Prediction,
} from "@/lib/risk-types";
import { RiskGauge } from "@/components/RiskGauge";
import { ShapChart } from "@/components/ShapChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function labelFor(key: CategoricalFeatureKey, option: string) {
  return key === "age" ? prettyAge(option) : prettyOption(option);
}

export function ManualAssessment() {
  const [form, setForm] = useState<FeaturePayload>({ ...EMPTY_PAYLOAD });
  const [result, setResult] = useState<{
    prediction: Prediction;
    explanation: Explanation;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: FeaturePayload) => ({
      prediction: await predictManual(payload),
      explanation: await explainManual(payload),
    }),
    onSuccess: (data) => setResult(data),
  });

  const setField = (key: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <section className="grid min-h-0 gap-6 overflow-auto scroll-clinical pb-4 xl:grid-cols-[1.4fr_minmax(0,1fr)]">
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(form);
        }}
      >
        <header className="border-b border-border pb-4">
          <p className="label-micro">Off-cohort case</p>
          <h1 className="mt-1 text-xl font-semibold sm:text-2xl">Manual assessment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Score a patient who is not in the indexed cohort.
          </p>
        </header>

        <fieldset className="panel p-5">
          <legend className="label-micro px-2">
            Hospital stay &amp; utilization
          </legend>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NUMERIC_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={f.key} className="label-micro">
                  {f.label}
                </Label>
                <Input
                  id={f.key}
                  type="number"
                  min={0}
                  className="h-9 rounded-sm bg-panel font-mono text-xs"
                  value={form[f.key]}
                  onChange={(e) => setField(f.key, Number(e.target.value))}
                />
              </div>
            ))}
          </div>
        </fieldset>

        {(["demographics", "clinical"] as const).map((group) => (
          <fieldset key={group} className="panel p-5">
            <legend className="label-micro px-2">
              {group === "demographics"
                ? "Demographics & admission"
                : "Labs, medication & diagnosis groups"}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORICAL_FIELDS.filter((f) => f.group === group).map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="label-micro">{f.label}</Label>
                  <Select value={form[f.key]} onValueChange={(v) => setField(f.key, v)}>
                    <SelectTrigger className="h-9 rounded-sm bg-panel text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={o} value={o}>
                          {labelFor(f.key, o)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="rounded-sm" disabled={mutation.isPending}>
            <Calculator className="mr-2 h-4 w-4" />
            {mutation.isPending ? "Calculating…" : "Calculate readmission risk"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="rounded-sm"
            onClick={() => setForm({ ...EXAMPLE_PAYLOAD })}
          >
            <FlaskConical className="mr-2 h-4 w-4" /> Load example
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setForm({ ...EMPTY_PAYLOAD });
              setResult(null);
              mutation.reset();
            }}
          >
            <Eraser className="mr-2 h-4 w-4" /> Clear
          </Button>
        </div>
      </form>

      <div className="space-y-3 xl:sticky xl:top-4 xl:self-start">
        {result ? (
          <>
            <RiskGauge prediction={result.prediction} />
            <ShapChart drivers={result.explanation.drivers} />
          </>
        ) : (
          <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-8 text-center">
            <Calculator className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Enter the case details and calculate to see a calibrated probability.
            </p>
          </div>
        )}
        {mutation.isError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Prediction failed. Check the entered values and try again.
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Scores run in the browser with a calibrated demo surrogate. Not the trained XGBoost
          artifact, and not for clinical use.
        </p>
      </div>
    </section>
  );
}
