import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  Brain,
  CheckCircle,
} from "lucide-react";
import type { AIAnalysis } from "@/lib/types/pitch";

interface AIAnalysisDisplayProps {
  analysis: AIAnalysis;
  showRegenerateButton?: boolean;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function AIAnalysisDisplay({
  analysis,
  showRegenerateButton = false,
  onRegenerate,
  isRegenerating = false,
}: AIAnalysisDisplayProps) {
  return (
    <div className="space-y-6">
      {showRegenerateButton && onRegenerate && (
        <div className="flex justify-center mb-4">
          <Button
            onClick={onRegenerate}
            disabled={isRegenerating}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Brain className="h-4 w-4 mr-2" />
            {isRegenerating ? "Regenerating..." : "Regenerate Analysis"}
          </Button>
        </div>
      )}

      {/* Overall Score */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800 font-semibold">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Overall Pitch Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-gray-900">
              {analysis.overallScore}/100
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${analysis.overallScore}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {analysis.overallScore >= 85
                  ? "Excellent pitch with strong potential"
                  : analysis.overallScore >= 70
                  ? "Good pitch with room for improvement"
                  : "Needs significant improvements"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 font-semibold">
              <ThumbsUp className="h-4 w-4" />
              Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.strengths.length > 0 ? (
              <ul className="space-y-3">
                {analysis.strengths.map((strength: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6">
                <div className="text-gray-400 mb-2">
                  <ThumbsUp className="h-8 w-8 mx-auto opacity-50" />
                </div>
                <p className="text-sm text-gray-500">
                  No significant strengths identified in this pitch.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Consider adding more detailed content to highlight your
                  business advantages.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Improvements */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 font-semibold">
              <Lightbulb className="h-4 w-4" />
              Suggested Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.improvements.map(
                (improvement: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{improvement}</span>
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Market Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analysis.marketPotential}
            </div>
            <div className="text-sm text-gray-500">Market Potential</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analysis.riskLevel}
            </div>
            <div className="text-sm text-gray-500">Risk Level</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {analysis.recommendations.length}
            </div>
            <div className="text-sm text-gray-500">Recommendations</div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 font-semibold">
              <Lightbulb className="h-4 w-4" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations.map(
                (recommendation: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <span>{recommendation}</span>
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
