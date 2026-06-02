import { useState } from 'react';
import { User, FileText, Video, Download, Share2, Settings, ChevronRight, Check } from 'lucide-react';
import { CustomAvatar } from '../utils/avatarGenerator';
import { VoiceProfile } from '../utils/voiceLibrary';
import { VideoResolution } from '../utils/videoResolutions';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface EnhancedWorkflowPanelProps {
  onOpenAvatarCreator: () => void;
  onOpenScriptCreator: () => void;
  onOpenVoiceEditor: () => void;
  onOpenSocialSettings: () => void;
  onOpenXCodeGenerator: () => void;
  avatar?: CustomAvatar | null;
  voice?: VoiceProfile | null;
  script?: string;
  resolution?: VideoResolution;
}

export function EnhancedWorkflowPanel({
  onOpenAvatarCreator,
  onOpenScriptCreator,
  onOpenVoiceEditor,
  onOpenSocialSettings,
  onOpenXCodeGenerator,
  avatar,
  voice,
  script,
  resolution
}: EnhancedWorkflowPanelProps) {
  const [activeStep, setActiveStep] = useState(1);

  const steps: WorkflowStep[] = [
    {
      id: 1,
      title: 'Create/Select Avatar',
      description: 'Choose from library or create custom avatar',
      icon: <User className="w-6 h-6" />,
      completed: !!avatar
    },
    {
      id: 2,
      title: 'Configure Voice',
      description: 'Select from 50+ voices and customize settings',
      icon: <Settings className="w-6 h-6" />,
      completed: !!voice
    },
    {
      id: 3,
      title: 'Write/Generate Script',
      description: 'Create script or use AI prompt',
      icon: <FileText className="w-6 h-6" />,
      completed: !!script && script.length > 0
    },
    {
      id: 4,
      title: 'Generate Video',
      description: 'Create video with avatar and voice',
      icon: <Video className="w-6 h-6" />,
      completed: false
    },
    {
      id: 5,
      title: 'Preview & Edit',
      description: 'Review and make adjustments',
      icon: <Settings className="w-6 h-6" />,
      completed: false
    },
    {
      id: 6,
      title: 'Export & Share',
      description: 'Download or share to social media',
      icon: <Share2 className="w-6 h-6" />,
      completed: false
    }
  ];

  const getStepAction = (stepId: number) => {
    switch (stepId) {
      case 1:
        return onOpenAvatarCreator;
      case 2:
        return onOpenVoiceEditor;
      case 3:
        return onOpenScriptCreator;
      case 4:
        return () => alert('Generate video action');
      case 5:
        return () => alert('Preview & edit action');
      case 6:
        return onOpenSocialSettings;
      default:
        return () => {};
    }
  };

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Production Workflow</h2>
        <p className="text-gray-600">Follow these steps to create professional AI videos</p>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold">Overall Progress</span>
            <span className="text-gray-600">{completedSteps}/{steps.length} steps</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`relative border-2 rounded-xl p-4 transition-all cursor-pointer ${
              step.completed
                ? 'border-green-500 bg-green-50'
                : activeStep === step.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
            onClick={() => {
              setActiveStep(step.id);
              getStepAction(step.id)();
            }}
          >
            <div className="flex items-center gap-4">
              {/* Step Number/Check */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  step.completed
                    ? 'bg-green-500 text-white'
                    : activeStep === step.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.completed ? <Check className="w-6 h-6" /> : step.icon}
              </div>

              {/* Step Info */}
              <div className="flex-1">
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>

              {/* Arrow */}
              <ChevronRight
                className={`w-6 h-6 transition-all ${
                  activeStep === step.id ? 'text-blue-600' : 'text-gray-400'
                }`}
              />
            </div>

            {/* Completion Badge */}
            {step.completed && (
              <div className="absolute top-2 right-2">
                <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                  ✓ DONE
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t-2 border-gray-200">
        <h3 className="font-bold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onOpenSocialSettings}
            className="px-4 py-3 bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300 rounded-lg hover:from-blue-200 hover:to-purple-200 transition-all font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Social Settings
          </button>
          <button
            onClick={onOpenXCodeGenerator}
            className="px-4 py-3 bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300 rounded-lg hover:from-orange-200 hover:to-red-200 transition-all font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            XCode Generator
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
        <h4 className="font-bold mb-2">📊 Current Status</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Avatar:</span>
            <span className={avatar ? 'text-green-600 font-semibold' : 'text-gray-500'}>
              {avatar ? avatar.name : 'Not selected'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Voice:</span>
            <span className={voice ? 'text-green-600 font-semibold' : 'text-gray-500'}>
              {voice ? voice.name : 'Not selected'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Script:</span>
            <span className={script ? 'text-green-600 font-semibold' : 'text-gray-500'}>
              {script ? `${script.length} chars` : 'Not written'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Resolution:</span>
            <span className={resolution ? 'text-green-600 font-semibold' : 'text-gray-500'}>
              {resolution ? resolution.name : 'Not selected'}
            </span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-yellow-900 mb-1">💡 Pro Tip</p>
        <p className="text-xs text-yellow-800">
          Complete all steps in order for the best results. You can always go back and make changes!
        </p>
      </div>
    </div>
  );
}
