import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface HeaderProps {
  onToggleSidenav: () => void; // Explicitly define the type of onToggleSidenav
}

const Header: React.FC<HeaderProps> = ({ onToggleSidenav }) => {
  return (
    <View className="flex-row justify-between items-center pt-10 px-4 pb-4 bg-white shadow-xl">
      {/* Hamburger Menu */}
      <TouchableOpacity onPress={onToggleSidenav}>
        <FontAwesome name="bars" size={24} color="black" />
      </TouchableOpacity>

      {/* Logo */}
      <Image
        source={{ uri: 'https://utfs.io/f/0ff868fa-4345-4cb6-a51a-4a2f328e302f-vmbbu4.png' }}
        style={{ width: 35, height: 35 }}
        className="mr-2"
        resizeMode="contain"
      />
    </View>
  );
};

export default Header;