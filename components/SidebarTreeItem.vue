<script setup lang="ts">
import { ref, computed } from 'vue'
import { type Host, useHostsStore } from '~/stores/hosts'
import { ChevronRight, ChevronDown, Folder, Monitor, Trash2, FolderOpen } from 'lucide-vue-next'

const props = defineProps<{
  item: Host
  depth: number
}>()

const emit = defineEmits(['connect', 'select-folder'])
const hostsStore = useHostsStore()
const isOpen = ref(false)

const children = computed(() => hostsStore.getChildren(props.item.id))
const hasChildren = computed(() => children.value.length > 0)

const toggleOpen = () => {
    if (props.item.type === 'folder') {
        isOpen.value = !isOpen.value
    }
}

const handleClick = () => {
    if (props.item.type === 'folder') {
        toggleOpen()
    } else {
        emit('connect', props.item.id)
    }
}

const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${props.item.name}?`)) {
        hostsStore.removeItem(props.item.id)
    }
}
</script>

<template>
  <div>
    <div 
        class="flex items-center gap-1 p-1 rounded-md hover:bg-muted cursor-pointer group transition-colors select-none text-sm"
        :style="{ paddingLeft: `${props.depth * 12 + 8}px` }"
        @click="handleClick"
    >
        <!-- Folder Icon / Chevron -->
        <div v-if="props.item.type === 'folder'" class="flex items-center text-muted-foreground mr-1">
            <component :is="isOpen ? ChevronDown : ChevronRight" class="w-3 h-3" />
            <component :is="isOpen ? FolderOpen : Folder" class="w-4 h-4 ml-1" />
        </div>
        
        <!-- Host Icon -->
        <Monitor v-else class="w-4 h-4 text-muted-foreground mr-2 group-hover:text-foreground" />

        <!-- Name -->
        <span class="flex-1 truncate font-medium text-foreground/80 group-hover:text-foreground">
            {{ props.item.name }}
        </span>

         <!-- Delete Action (Hover) -->
         <button 
            @click.stop="handleDelete" 
            class="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
        >
            <Trash2 class="w-3 h-3" />
        </button>
    </div>

    <!-- Children (Recursive) -->
    <div v-if="props.item.type === 'folder' && isOpen">
        <SidebarTreeItem 
            v-for="child in children" 
            :key="child.id" 
            :item="child" 
            :depth="props.depth + 1"
            @connect="$emit('connect', $event)"
        />
        <div v-if="children.length === 0" class="text-xs text-muted-foreground italic py-1" :style="{ paddingLeft: `${(props.depth + 1) * 12 + 24}px` }">
            Empty
        </div>
    </div>
  </div>
</template>
