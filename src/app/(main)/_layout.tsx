import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'My Lists',
        }} 
      />
      <Stack.Screen 
        name="list/[id]" 
        options={{ 
          title: 'List Details',
        }} 
      />
    </Stack>
  );
}
