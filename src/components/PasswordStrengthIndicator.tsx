"use client";

import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  PasswordValidationService,
  PasswordValidationResult,
  PasswordValidationContext,
} from "@/lib/passwordValidation";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Info,
} from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
  context?: PasswordValidationContext;
  showRequirements?: boolean;
  showSuggestions?: boolean;
  showStrengthBar?: boolean;
  onValidationChange?: (result: PasswordValidationResult | null) => void;
  checkCompromised?: boolean;
  debounceMs?: number;
  className?: string;
}

const strengthColors = {
  very_weak: "bg-red-500",
  weak: "bg-orange-500",
  fair: "bg-yellow-500",
  strong: "bg-green-500",
  very_strong: "bg-emerald-500",
};

const strengthLabels = {
  very_weak: "Very Weak",
  weak: "Weak",
  fair: "Fair",
  strong: "Strong",
  very_strong: "Very Strong",
};

const strengthIcons = {
  very_weak: ShieldX,
  weak: ShieldAlert,
  fair: Shield,
  strong: ShieldCheck,
  very_strong: ShieldCheck,
};

export function PasswordStrengthIndicator({
  password,
  context,
  showRequirements = true,
  showSuggestions = true,
  showStrengthBar = true,
  onValidationChange,
  checkCompromised = true,
  debounceMs = 300,
  className,
}: PasswordStrengthIndicatorProps) {
  const [validationResult, setValidationResult] =
    useState<PasswordValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validator = React.useMemo(
    () => new PasswordValidationService({ checkCompromised }),
    [checkCompromised],
  );

  const validatePasswordDebounced = useCallback(async () => {
    if (!password) {
      setValidationResult(null);
      onValidationChange?.(null);
      return;
    }

    setIsLoading(true);

    try {
      // First do sync validation for immediate feedback
      const syncResult = validator.validatePasswordSync(password, context);

      // Show sync result immediately
      const partialResult: PasswordValidationResult = {
        ...syncResult,
        strength: syncResult.strength,
      };
      setValidationResult(partialResult);

      // Then do async validation (HIBP check) if enabled
      if (checkCompromised) {
        const fullResult = await validator.validatePassword(password, context);
        setValidationResult(fullResult);
        onValidationChange?.(fullResult);
      } else {
        onValidationChange?.(partialResult);
      }
    } catch (error) {
      console.error("Password validation error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [password, context, validator, checkCompromised, onValidationChange]);

  useEffect(() => {
    const timer = setTimeout(validatePasswordDebounced, debounceMs);
    return () => clearTimeout(timer);
  }, [validatePasswordDebounced, debounceMs]);

  if (!password) {
    return null;
  }

  const StrengthIcon = validationResult
    ? strengthIcons[validationResult.strength]
    : Shield;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength Bar */}
      {showStrengthBar && validationResult && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <StrengthIcon
                className={cn(
                  "h-4 w-4",
                  validationResult.strength === "very_weak" && "text-red-500",
                  validationResult.strength === "weak" && "text-orange-500",
                  validationResult.strength === "fair" && "text-yellow-500",
                  validationResult.strength === "strong" && "text-green-500",
                  validationResult.strength === "very_strong" &&
                    "text-emerald-500",
                )}
              />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Password strength: {strengthLabels[validationResult.strength]}
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">
              {validationResult.score}%
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                strengthColors[validationResult.strength],
              )}
              style={{ width: `${validationResult.score}%` }}
            />
          </div>
        </div>
      )}

      {/* Errors */}
      {validationResult && validationResult.errors.length > 0 && (
        <div className="space-y-1">
          {validationResult.errors
            .filter((e) => e.severity === "error")
            .map((error, index) => (
              <div
                key={`error-${index}`}
                className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
              >
                <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error.message}</span>
              </div>
            ))}
        </div>
      )}

      {/* Warnings */}
      {validationResult && validationResult.warnings.length > 0 && (
        <div className="space-y-1">
          {validationResult.warnings.map((warning, index) => (
            <div
              key={`warning-${index}`}
              className="flex items-start gap-2 text-sm text-yellow-600 dark:text-yellow-400"
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Requirements Checklist */}
      {showRequirements && (
        <PasswordRequirements
          password={password}
          validationResult={validationResult}
        />
      )}

      {/* Suggestions */}
      {showSuggestions &&
        validationResult &&
        validationResult.suggestions.length > 0 && (
          <div className="space-y-1 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Info className="h-4 w-4" />
              <span>Suggestions:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {validationResult.suggestions
                .slice(0, 3)
                .map((suggestion, index) => (
                  <li key={`suggestion-${index}`}>{suggestion}</li>
                ))}
            </ul>
          </div>
        )}

      {/* Loading indicator for HIBP check */}
      {isLoading && checkCompromised && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
          <span>Checking against known breaches...</span>
        </div>
      )}
    </div>
  );
}

interface PasswordRequirementsProps {
  password: string;
  validationResult: PasswordValidationResult | null;
}

function PasswordRequirements({
  password,
  validationResult,
}: PasswordRequirementsProps) {
  const requirements = [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
      alternative: password.length >= 15 ? "(or 15+ for passphrase)" : null,
    },
    {
      label: "One uppercase letter (A-Z)",
      met: /[A-Z]/.test(password),
      bypassedByPassphrase: password.length >= 15,
    },
    {
      label: "One lowercase letter (a-z)",
      met: /[a-z]/.test(password),
      bypassedByPassphrase: password.length >= 15,
    },
    {
      label: "One number (0-9)",
      met: /[0-9]/.test(password),
      bypassedByPassphrase: password.length >= 15,
    },
    {
      label: "One special character (!@#$...)",
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
      bypassedByPassphrase: password.length >= 15,
    },
  ];

  const hasKeyboardPatternError = validationResult?.errors.some(
    (e) =>
      e.code === "KEYBOARD_PATTERN" || e.code === "KEYBOARD_PATTERN_REVERSED",
  );

  const hasRepetitiveError = validationResult?.errors.some(
    (e) => e.code === "REPETITIVE_CHARS",
  );

  const hasDictionaryError = validationResult?.errors.some(
    (e) => e.code === "DICTIONARY_WORD",
  );

  const hasCompromisedError = validationResult?.errors.some(
    (e) => e.code === "COMPROMISED_PASSWORD",
  );

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Requirements:
      </span>
      <ul className="space-y-1">
        {requirements.map((req, index) => {
          const isBypassed = req.bypassedByPassphrase && password.length >= 15;
          const isMet = req.met || isBypassed;

          return (
            <li
              key={index}
              className={cn(
                "flex items-center gap-2 text-sm",
                isMet
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-500 dark:text-gray-400",
              )}
            >
              {isMet ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
              )}
              <span>
                {req.label}
                {isBypassed && !req.met && (
                  <span className="text-gray-400 ml-1">
                    (bypassed: passphrase)
                  </span>
                )}
              </span>
            </li>
          );
        })}

        {/* Additional security checks */}
        <li
          className={cn(
            "flex items-center gap-2 text-sm",
            !hasKeyboardPatternError
              ? "text-green-600 dark:text-green-400"
              : "text-red-500 dark:text-red-400",
          )}
        >
          {!hasKeyboardPatternError ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span>No keyboard patterns</span>
        </li>

        <li
          className={cn(
            "flex items-center gap-2 text-sm",
            !hasRepetitiveError
              ? "text-green-600 dark:text-green-400"
              : "text-red-500 dark:text-red-400",
          )}
        >
          {!hasRepetitiveError ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span>No repetitive characters</span>
        </li>

        <li
          className={cn(
            "flex items-center gap-2 text-sm",
            !hasDictionaryError
              ? "text-green-600 dark:text-green-400"
              : "text-red-500 dark:text-red-400",
          )}
        >
          {!hasDictionaryError ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span>Not a dictionary word</span>
        </li>

        {validationResult && hasCompromisedError !== undefined && (
          <li
            className={cn(
              "flex items-center gap-2 text-sm",
              !hasCompromisedError
                ? "text-green-600 dark:text-green-400"
                : "text-red-500 dark:text-red-400",
            )}
          >
            {!hasCompromisedError ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span>Not found in data breaches</span>
          </li>
        )}
      </ul>
    </div>
  );
}

// Password input with toggle visibility
interface PasswordInputWithStrengthProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  context?: PasswordValidationContext;
  showStrengthIndicator?: boolean;
  onValidationChange?: (result: PasswordValidationResult | null) => void;
}

export function PasswordInputWithStrength({
  context,
  showStrengthIndicator = true,
  onValidationChange,
  className,
  ...props
}: PasswordInputWithStrengthProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState((props.value as string) || "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    props.onChange?.(e);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          {...props}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={handleChange}
          className={cn(
            "w-full pr-10 rounded-md border border-gray-300 dark:border-gray-600",
            "px-3 py-2 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "dark:bg-gray-800 dark:text-white",
            className,
          )}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {showStrengthIndicator && (
        <PasswordStrengthIndicator
          password={password}
          context={context}
          onValidationChange={onValidationChange}
        />
      )}
    </div>
  );
}

export default PasswordStrengthIndicator;
