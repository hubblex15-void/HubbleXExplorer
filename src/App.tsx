import React, { useState, useEffect } from 'react';
import { TallyProvider, useTallyStore } from './store/useTallyStore.tsx';
import { ThemeProvider } from './components/theme/ThemeProvider.tsx';
import { ParticleProvider, useParticleSpawner } from './components/ui/ParticleLayer.tsx';
import { Hotbar } from './components/navigation/Hotbar.tsx';
import { TopHUD } from './components/navigation/TopHUD.tsx';
import { BaseCampScreen } from './screens/BaseCampScreen.tsx';
import { TallyLogScreen } from './screens/TallyLogScreen.tsx';
import { QuestBoardScreen } from './screens/QuestBoardScreen.tsx';
import { CelebrationBanner } from './components/ui/CelebrationBanner.tsx';
import { SettingsModal } from './components/settings/SettingsModal.tsx';
import { CategoryManagerModal } from './components/categories/CategoryManagerModal.tsx';
import { Modal } from './components/ui/Modal.tsx';
import { DialogueBox } from './components/ui/DialogueBox.tsx';
import { HotbarSlotId } from './types/index.ts';
import type { WeatherTarget } from './livingscene/index.ts';

const AppContent: React.FC = () => {
  const {
    state,
    activeCelebration,
    dismissCelebration,
    isCategoryModalOpen,
    closeCategoryModal,
  } = useTallyStore();

  const { spawnLevelUpFireworks } = useParticleSpawner();

  const [currentSlot, setCurrentSlot] = useState<HotbarSlotId>('base_camp');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [liveWeather, setLiveWeather] = useState<WeatherTarget | undefined>(undefined);

  // Trigger pixel fireworks when leveling up
  useEffect(() => {
    if (activeCelebration?.type === 'level_up') {
      spawnLevelUpFireworks();
    }
  }, [activeCelebration, spawnLevelUpFireworks]);

  // Locked slot dialogue state
  const [lockedDialog, setLockedDialog] = useState<{
    isOpen: boolean;
    featureName: string;
    description: string;
  }>({
    isOpen: false,
    featureName: '',
    description: '',
  });

  const handleLockedClick = (featureName: string, description: string) => {
    setLockedDialog({
      isOpen: true,
      featureName,
      description,
    });
  };

  const activeQuestsCount = state.quests.filter(q => q.status === 'active').length;

  return (
    <div className="min-h-screen flex flex-col bg-cream text-cocoa transition-colors duration-150">
      {/* Top HUD with App Title, Level, XP Bar, Streaks, Weather Clock & Settings */}
      <TopHUD onOpenSettings={() => setIsSettingsOpen(true)} weather={liveWeather} />

      {/* Main Realm Canvas */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 pb-24 sm:pb-8">
        {currentSlot === 'base_camp' && (
          <BaseCampScreen
            onNavigateToTallyLog={() => setCurrentSlot('tally_log')}
            onNavigateToQuests={() => setCurrentSlot('quest_board')}
            onWeatherChange={setLiveWeather}
          />
        )}

        {currentSlot === 'tally_log' && <TallyLogScreen />}

        {currentSlot === 'quest_board' && <QuestBoardScreen />}
      </main>

      {/* 6-Slot Hotbar (Bottom on mobile, sticky bar) */}
      <Hotbar
        activeSlot={currentSlot}
        onSelectSlot={slotId => setCurrentSlot(slotId)}
        onLockedClick={handleLockedClick}
        activeQuestsCount={activeQuestsCount}
      />

      {/* Celebration Banner for Level Up, Goal Met, Quest Complete */}
      <CelebrationBanner event={activeCelebration} onDismiss={dismissCelebration} />

      {/* Settings & Vault Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Realm Category Manager Modal */}
      <CategoryManagerModal isOpen={isCategoryModalOpen} onClose={closeCategoryModal} />

      {/* Locked Feature Dialogue Popup */}
      <Modal
        isOpen={lockedDialog.isOpen}
        onClose={() => setLockedDialog(prev => ({ ...prev, isOpen: false }))}
        title={`${lockedDialog.featureName} • Sector locked`}
        maxWidth="md"
      >
        <div className="py-2">
          <DialogueBox
            speaker="Tally Sprite"
            text={lockedDialog.description}
            actionText="Return to base camp"
            onAction={() => {
              setLockedDialog(prev => ({ ...prev, isOpen: false }));
              setCurrentSlot('base_camp');
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default function App() {
  return (
    <TallyProvider>
      <ThemeProvider>
        <ParticleProvider>
          <AppContent />
        </ParticleProvider>
      </ThemeProvider>
    </TallyProvider>
  );
}
