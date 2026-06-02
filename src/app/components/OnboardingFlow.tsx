// =============================================================================
// ONBOARDING FLOW — Interactive Tutorial for New Users
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, Target, Zap, Award } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  highlightElement?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingFlowProps {
  isopen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingFlow({ isopen, onClose, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: '👋 Welcome to AI Ad Generator!',
      description: 'Create viral blog posts and ads in seconds with our 65-agent AI system. Let\'s take a quick tour!',
      icon: Sparkles,
    },
    {
      id: 'character',
      title: '🎭 Step 1: Choose Your Voice',
      description: 'Select a character to define the tone and style of your content. Each character brings a unique perspective to your blog posts.',
      icon: Target,
      highlightElement: '.character-selector',
      action: {
        label: 'Pick a Character',
        onClick: () => {
          // Scroll to character selector
          const element = document.querySelector('.character-selector');
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
      },
    },
    {
      id: 'url',
      title: '🔗 Step 2: Enter Your Source',
      description: 'Paste any website URL to extract products, services, or content. Our AI will analyze and generate optimized blog posts automatically.',
      icon: Zap,
      highlightElement: '.url-input',
    },
    {
      id: 'templates',
      title: '📚 Step 3: Use Templates (Optional)',
      description: 'Browse our library of pre-built templates for different content types: how-tos, reviews, comparisons, and more.',
      icon: Award,
      action: {
        label: 'Explore Templates',
        onClick: () => {
          onClose();
          // Trigger template library open
          const event = new CustomEvent('openTemplatesLibrary');
          window.dispatchEvent(event);
        },
      },
    },
    {
      id: 'customize',
      title: '✏️ Step 4: Edit & Optimize',
      description: 'Each generated post includes SEO optimization, quality scoring, and edit tools. Use undo/redo, auto-save, and quality checks to perfect your content.',
      icon: Sparkles,
    },
    {
      id: 'export',
      title: '🚀 Step 5: Publish & Share',
      description: 'Export to multiple formats (Markdown, HTML, PDF), publish to WordPress, or schedule across social media platforms.',
      icon: Target,
    },
  ];

  useEffect(() => {
    if (!isopen) {
      setCurrentStep(0);
    }
  }, [isopen]);

  if (!isopen) return null;

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onClose();
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
    onComplete();
    onClose();
  };

  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
                <p className="text-sm text-white/80 mt-1">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6">
            {currentStepData.description}
          </p>

          {currentStepData.action && (
            <button
              onClick={currentStepData.action.onClick}
              className="mb-6 px-6 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors font-semibold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {currentStepData.action.label}
            </button>
          )}

          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentStep
                    ? 'bg-purple-600 w-8'
                    : completedSteps.has(step.id)
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                title={step.title}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${isFirstStep
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSkip}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold transition-colors"
              >
                Skip Tour
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold flex items-center gap-2 shadow-lg"
              >
                {isLastStep ? (
                  <>
                    <Check className="w-4 h-4" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Fun Facts Footer */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="font-medium">Pro Tip:</span>
            <span>Use Cmd+K (or Ctrl+K) to open the command palette for quick access to any feature!</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage onboarding flow state
 */
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem('onboarding_completed');
    if (!hasCompleted) {
      // Show onboarding after a brief delay
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    setShowOnboarding,
    resetOnboarding,
  };
}
