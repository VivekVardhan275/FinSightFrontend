
import type { GroupExpense, GroupExpenseSubmitData } from '@/types';

// --- Mock Data Store ---
// This acts as our in-memory "database" for the mock service.
let MOCK_GROUPS: GroupExpense[] = [
    {
        id: "3456wfghj3dh",
        groupName: "Trip to Goa",
        email: "review-user@example.com",
        members: ["Alice", "Bob", "Charlie"],
        expenses: [2000.0, 1000.0, 0.0],
        balance: [1000.0, 0.0, -1000.0],
        totalExpense: 3000.0
    },
    {
        id: "9876xyzab5ef",
        groupName: "Office Lunch",
        email: "review-user@example.com",
        members: ["David", "Eve"],
        expenses: [500.0, 500.0],
        balance: [0.0, 0.0],
        totalExpense: 1000.0
    }
];

// --- Mock Service Functions ---

/**
 * Simulates fetching all group expenses from a backend.
 * @returns A promise that resolves to an array of GroupExpense objects.
 */
export const fetchGroupExpenses = async (): Promise<GroupExpense[]> => {
    console.log("MOCK API: Fetching all groups...");
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Return a deep copy to prevent direct state mutation
    return JSON.parse(JSON.stringify(MOCK_GROUPS));
};

/**
 * Simulates creating a new group expense on the backend.
 * @param data The data for the new group to be created.
 * @returns A promise that resolves to the newly created GroupExpense object (with an ID).
 */
export const createGroupExpense = async (data: GroupExpenseSubmitData): Promise<GroupExpense> => {
    console.log("MOCK API: Creating new group...", data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newGroup: GroupExpense = {
        ...data,
        id: `mock_id_${Date.now()}`, // Generate a unique mock ID
    };
    
    MOCK_GROUPS.push(newGroup);
    return JSON.parse(JSON.stringify(newGroup));
};

/**
 * Simulates updating an existing group expense on the backend.
 * @param groupId The ID of the group to update.
 * @param data The new data for the group.
 * @returns A promise that resolves to the updated GroupExpense object.
 */
export const updateGroupExpense = async (groupId: string, data: GroupExpenseSubmitData): Promise<GroupExpense> => {
    console.log(`MOCK API: Updating group ${groupId}...`, data);
    await new Promise(resolve => setTimeout(resolve, 500));

    const groupIndex = MOCK_GROUPS.findIndex(g => g.id === groupId);

    if (groupIndex === -1) {
        throw new Error("Group not found.");
    }

    const updatedGroup: GroupExpense = {
        ...data,
        id: groupId,
    };

    MOCK_GROUPS[groupIndex] = updatedGroup;
    return JSON.parse(JSON.stringify(updatedGroup));
};

/**
 * Simulates deleting a group expense from the backend.
 * @param groupId The ID of the group to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export const deleteGroupExpense = async (groupId: string): Promise<void> => {
    console.log(`MOCK API: Deleting group ${groupId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));

    const initialLength = MOCK_GROUPS.length;
    MOCK_GROUPS = MOCK_GROUPS.filter(g => g.id !== groupId);

    if (MOCK_GROUPS.length === initialLength) {
        // This simulates a "not found" error on the server
        console.warn(`MOCK API: Group with ID ${groupId} not found for deletion.`);
    }
};
