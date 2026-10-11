import { motion } from 'framer-motion'
import { Screen } from '../components/Screen'
import { Tile } from '../components/Tile'
import { SoundToggle, VoiceToggle } from '../components/AudioToggles'

export default function Home() {
  return (
    <Screen
      right={
        <div className="flex gap-3">
          <VoiceToggle />
          <SoundToggle />
        </div>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-10">
        <div className="text-center">
          <motion.div
            className="text-8xl"
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1 }}
            aria-hidden
          >
            🧸
          </motion.div>
          <h1 className="mt-2 text-5xl font-bold sm:text-6xl">Conta pra Mim</h1>
          <p className="mt-2 text-xl opacity-70">Histórias e brincadeiras para falar</p>
        </div>

        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          <Tile to="/historias" emoji="📖" label="Histórias" color="var(--color-coral)" big />
          <Tile to="/quiz" emoji="🎯" label="Brincar" color="var(--color-sky)" big />
        </div>
      </div>
    </Screen>
  )
}
