"use client";

import { SparklesIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const examplePrompts = [
  "I need a senior Next.js + NestJS developer for a SaaS marketplace.",
  "Looking for a mobile developer with React Native and Firebase experience.",
  "We need a backend engineer skilled in distributed systems and Go.",
  "Find me a frontend lead who knows Vue.js and GraphQL.",
];

interface EmptyMatchStateProps {
  userType: string | null;
  onExampleClick: (example: string) => void;
}

export function EmptyMatchState({ userType, onExampleClick }: EmptyMatchStateProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="max-w-lg w-full text-center">
        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <SparklesIcon className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Find your perfect developer
        </h2>
        <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto">
          Describe your project requirements in plain English. Our AI will analyze the
          developer pool and return a ranked shortlist with detailed reasoning.
        </p>
        {userType && (
          <Badge className="mb-6 font-normal">
            {userType === "guest" && "Guest mode - limited features"}
          </Badge>
        )}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
            Try an example
          </p>
          <div className="space-y-2">
            {examplePrompts.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="md"
                onClick={() => onExampleClick(example)}
                className="w-full justify-start"
              >
                &ldquo;{example}&rdquo;
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
