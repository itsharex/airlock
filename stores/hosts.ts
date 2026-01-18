
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { encrypt, decrypt } from '~/utils/security' // Assuming alias works, or relative path

export interface Host {
    id: string
    name: string
    type: 'host' | 'folder'
    parentId: string | null
    host?: string // Optional for folders
    port?: number // Optional for folders
    username?: string // Optional for folders
    encrypted_password?: string
    private_key_path?: string
}

export const useHostsStore = defineStore('hosts', () => {
    const hosts = ref<Host[]>([])

    // Helper to get children of a node
    const getChildren = (parentId: string | null) => {
        return hosts.value.filter(h => h.parentId === parentId)
    }

    // Helper to recursively delete items
    const deleteRecursive = (id: string) => {
        const children = getChildren(id)
        children.forEach(child => deleteRecursive(child.id))
        hosts.value = hosts.value.filter(h => h.id !== id)
    }

    async function addHost(hostData: Omit<Host, 'id' | 'type' | 'encrypted_password'> & { password?: string }) {
        const id = crypto.randomUUID()
        let encrypted_password = ''

        if (hostData.password) {
            encrypted_password = await encrypt(hostData.password)
        }

        hosts.value.push({
            id,
            type: 'host',
            parentId: hostData.parentId || null,
            name: hostData.name,
            host: hostData.host,
            port: hostData.port,
            username: hostData.username,
            encrypted_password,
            private_key_path: hostData.private_key_path
        })
    }

    function addFolder(name: string, parentId: string | null = null) {
        const id = crypto.randomUUID()
        hosts.value.push({
            id,
            type: 'folder',
            parentId,
            name,
            host: '', // Placeholder
            port: 0, // Placeholder
            username: '' // Placeholder
        })
    }

    function removeItem(id: string) {
        deleteRecursive(id)
    }

    async function updateHost(id: string, updates: Partial<Host> & { password?: string }) {
        const index = hosts.value.findIndex(h => h.id === id)
        if (index === -1) return

        const host = { ...hosts.value[index], ...updates }

        // If a new password is provided, re-encrypt it
        if (updates.password !== undefined) {
            host.encrypted_password = await encrypt(updates.password)
            delete (host as any).password // Don't store plain password
        }

        hosts.value[index] = host
    }

    function updateFolder(id: string, name: string) {
        const index = hosts.value.findIndex(h => h.id === id)
        if (index === -1) return
        if (hosts.value[index].type !== 'folder') return

        hosts.value[index].name = name
    }

    async function getDecryptedPassword(id: string): Promise<string> {
        const host = hosts.value.find(h => h.id === id)
        if (!host || !host.encrypted_password) return ''
        return await decrypt(host.encrypted_password)
    }

    function replaceState(newHosts: Host[]) {
        hosts.value = newHosts
    }

    return {
        hosts,
        addHost,
        addFolder,
        removeItem,
        updateHost,
        updateFolder,
        getDecryptedPassword,
        getChildren,
        replaceState
    }
}, {
    persist: {
        storage: localStorage,
    },
})
