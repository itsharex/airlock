<script setup lang="ts">
import { ref } from 'vue'
import { useSessionsStore } from '~/stores/sessions'
import { invoke } from '@tauri-apps/api/core'
import Terminal from './components/Terminal.vue'
import HostSidebar from './components/HostSidebar.vue'
import { X, PanelLeft, PanelLeftClose } from 'lucide-vue-next'

const sessionsStore = useSessionsStore()
const isSidebarOpen = ref(true)

const handleConnect = async (connectionDetails: any) => {
    const id = `session-${Date.now()}`
    
    // Add session to store
    sessionsStore.addSession({
        id,
        hostLabel: `${connectionDetails.username}@${connectionDetails.host}`,
        status: 'connected'
    })

    try {
        await invoke('connect_ssh', {
            id,
            host: connectionDetails.host,
            port: Number(connectionDetails.port),
            user: connectionDetails.username,
            password: connectionDetails.password || undefined 
        })
    } catch (e) {
        console.error("Connect failed", e)
        // If connection fails immediately, remove the session?
        // For now, let it stay open so user sees error output
    }
}
</script>

<template>
  <div class="flex h-screen bg-background text-foreground font-sans overflow-hidden">
    <!-- Sidebar -->
    <div v-show="isSidebarOpen" class="flex-shrink-0 h-full">
        <HostSidebar @connect="handleConnect" />
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
        <!-- Tabs Header -->
        <div class="flex items-center border-b border-border bg-card h-10 flex-shrink-0">
             <!-- Sidebar Toggle -->
            <button 
                @click="isSidebarOpen = !isSidebarOpen"
                class="h-full px-3 hover:bg-muted border-r border-border flex items-center justify-center transition-colors"
                :title="isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'"
            >
                <PanelLeftClose v-if="isSidebarOpen" class="w-4 h-4 text-muted-foreground" />
                <PanelLeft v-else class="w-4 h-4 text-muted-foreground" />
            </button>

             <!-- Tabs Container -->
            <div class="flex-1 flex items-center overflow-x-auto no-scrollbar scroll-smooth">
                <div 
                    v-for="s in sessionsStore.sessions" 
                    :key="s.id"
                    @click="sessionsStore.setActive(s.id)"
                    :class="['group flex-shrink-0 flex items-center gap-2 px-4 h-full text-sm cursor-pointer border-r border-border hover:bg-muted select-none whitespace-nowrap', sessionsStore.activeSessionId === s.id ? 'bg-background font-medium' : 'text-muted-foreground bg-muted/50']"
                >
                    <span>{{ s.hostLabel }}</span>
                    <button 
                        @click.stop="sessionsStore.removeSession(s.id)"
                        class="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-zinc-700/50 transition-all"
                    >
                        <X class="w-3 h-3" />
                    </button>
                </div>
                <div v-if="sessionsStore.sessions.length === 0" class="px-4 text-sm text-muted-foreground italic whitespace-nowrap">
                    No active sessions
                </div>
            </div>
        </div>

        <!-- Terminal Area -->
        <div class="flex-1 bg-zinc-950 relative overflow-hidden">
            <template v-for="s in sessionsStore.sessions" :key="s.id">
                <div v-show="sessionsStore.activeSessionId === s.id" class="absolute inset-0 p-2">
                    <Terminal :session-id="s.id" />
                </div>
            </template>
            <div v-if="sessionsStore.sessions.length === 0" class="flex items-center justify-center h-full text-muted-foreground">
                <div class="text-center">
                    <p class="text-lg font-medium text-foreground">Welcome to Airlock</p>
                    <p>Select a host from the sidebar to connect.</p>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.no-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
