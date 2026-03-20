/**
 * Validation schemas for runtime data validation
 * Prevents injection attacks and data corruption
 */

import { z } from 'zod';

/**
 * Schema for zoo save data
 * Validates all data loaded from localStorage
 */
export const ZooSaveSchema = z.object({
    name: z.string().min(1).max(50),
    date: z.string(),
    terrain: z.array(z.number().min(0).max(20)).length(5625), // 75x75 grid
    paths: z.array(z.number().min(0).max(10)),
    animals: z.array(z.object({
        id: z.string().min(1).max(20),
        tileX: z.number().min(0).max(74),
        tileY: z.number().min(0).max(74)
    })).max(200), // Reasonable limit
    scenery: z.array(z.object({
        id: z.string().min(1).max(20),
        x: z.number().min(0).max(74),
        y: z.number().min(0).max(74)
    })).max(500),
    fences: z.array(z.object({
        id: z.string().min(1).max(20),
        x: z.number().min(0).max(74),
        y: z.number().min(0).max(74),
        side: z.enum(['n', 'e', 's', 'w'])
    })).max(1000),
    cash: z.number().min(0).max(10_000_000)
});

export type ZooSaveData = z.infer<typeof ZooSaveSchema>;

/**
 * Schema for network packets
 * Validates all data received over the network
 */
export const NetworkPacketSchema = z.discriminatedUnion('type', [
    z.object({ 
        type: z.literal('hello'), 
        name: z.string().min(1).max(20)
    }),
    z.object({ 
        type: z.literal('world_state'), 
        data: ZooSaveSchema 
    }),
    z.object({ 
        type: z.literal('action'), 
        action: z.enum(['place_animal', 'place_scenery', 'place_fence', 'paint_terrain', 'paint_path']),
        data: z.object({
            id: z.string().optional(),
            x: z.number().min(0).max(74).optional(),
            y: z.number().min(0).max(74).optional(),
            side: z.enum(['n', 'e', 's', 'w']).optional(),
            type: z.union([z.number(), z.string()]).optional()
        })
    }),
    z.object({ 
        type: z.literal('chat'), 
        message: z.string().min(1).max(200), 
        sender: z.string().min(1).max(20) 
    })
]);

export type NetworkPacket = z.infer<typeof NetworkPacketSchema>;

/**
 * Validate data from localStorage
 * Returns validated data or null if invalid
 */
export function validateLocalStorage<T>(
    key: string,
    schema: z.ZodSchema<T>
): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    
    try {
        const parsed = JSON.parse(raw);
        return schema.parse(parsed);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error(`[Validation] Invalid data for key "${key}":`, e.errors);
        } else {
            console.error(`[Validation] Failed to parse data for key "${key}":`, e);
        }
        return null;
    }
}

/**
 * Validate network packet
 * Returns validated packet or null if invalid
 */
export function validateNetworkPacket(data: unknown): NetworkPacket | null {
    try {
        return NetworkPacketSchema.parse(data);
    } catch (e) {
        if (e instanceof z.ZodError) {
            console.error('[Network] Invalid packet received:', e.errors);
        }
        return null;
    }
}
