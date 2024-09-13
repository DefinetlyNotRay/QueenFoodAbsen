import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sidenav from '../components/Sidenav';
import { BlurView } from 'expo-blur';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { Table, Row, Rows } from 'react-native-table-component';

const AdminPage: React.FC = () => {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    attendedToday: 0,
    izinToday: 0,
  });
  const [isSidenavVisible, setSidenavVisible] = useState(false);
  const [date, setDate] = useState(new Date());
  const [selectedDate1, setSelectedDate1] = useState<string | null>(null);
  const [selectedDate2, setSelectedDate2] = useState<string | null>(null);
  const [tableData, setTableData] = useState([['1', 'Alex', '01/09/24', "-", "Hadir"]]);
  const tableHead = ['ID', 'Account', 'Tanggal', 'Absen Time', 'Pulang Time', 'Detail']; // Ensure you have a matching table head

  const [filteredData, setFilteredData] = useState(tableData);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [isFocus, setIsFocus] = useState(false);

  const items = [
    { label: 'Hadir', value: 'Hadir' },
    { label: 'Sakit', value: 'Sakit' },
    { label: 'Izin', value: 'Izin' },
    { label: 'Alpa', value: 'Alpa' },

  ];
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
    return `${day}/${month}/${year}`;
  };

  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(`20${year}`, month - 1, day);
  };

  useEffect(() => {
    const getData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await fetch('https://9132-103-224-125-54.ngrok-free.app/table-absen', {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (!response.ok) {
          Alert.alert('Error', 'Failed to fetch attendance');
          return;
        }
  
        const data = await response.json();
  
        const formattedData = data.map(row => {
          const absenTime = new Date(row.absen_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const absenDate = new Date(row.absen_time);
          const formattedDate = formatDate(absenDate);
          const pulangTime = new Date(row.pulang_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
          return [
            row.id_absen,
            row.nama_karyawan,
            formattedDate,
            absenTime,
            pulangTime,
            row.detail
          ];
        });
  
        setTableData(formattedData);
      } catch (error) {
        console.error('Failed to get attendance:', error);
      }
    };
  
    getData();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const level = await AsyncStorage.getItem('level');
        if (level === 'user') {
          router.replace('/HomePage');
        }
        if (!token) {
          router.replace('/index');
        }
      } catch (error) {
        console.error('Failed to get auth token:', error);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const getStats = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await fetch('https://9132-103-224-125-54.ngrok-free.app/employee-stats', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          Alert.alert('Error', 'Failed to fetch statistics');
          return;
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to get stats:', error);
      }
    };

    getStats();
  }, []);

  const toggleSidenav = () => {
    setSidenavVisible(!isSidenavVisible);
  };

  const closeSidenav = () => {
    setSidenavVisible(false);
  };

  const showDatePicker = (isFirstDatePicker: boolean) => {
    DateTimePickerAndroid.open({
      value: date,
      onChange: (event, selectedDate) => {
        if (selectedDate) {
          const formattedDate = formatDate(selectedDate);
          if (isFirstDatePicker) {
            setSelectedDate1(formattedDate);
          } else {
            setSelectedDate2(formattedDate);
          }
        }
      },
      mode: 'date',
      is24Hour: true,
    });
  };

  useEffect(() => {
    const filterData = () => {
      const startDate = selectedDate1 ? parseDate(selectedDate1) : null;
      const endDate = selectedDate2 ? parseDate(selectedDate2) : null;

      const filtered = tableData.filter(row => {
        const absenDate = parseDate(row[2]); // 'Tanggal' column
        if (startDate && !endDate) {
          // Filter by a single date
          return absenDate.toDateString() === startDate.toDateString();
        } else if (startDate && endDate) {
          // Filter between two dates
          return absenDate >= startDate && absenDate <= endDate;
        }
        return true;
      });

      // Sort filtered data by date
      filtered.sort((a, b) => parseDate(a[2]).getTime() - parseDate(b[2]).getTime());

      setFilteredData(filtered);
    };

    filterData();
  }, [selectedDate1, selectedDate2, tableData]);

  return (
    <View style={{ flex: 1 }}>
      <Header onToggleSidenav={toggleSidenav} />

      {isSidenavVisible && (
        <TouchableOpacity style={styles.blurContainer} activeOpacity={1} onPress={closeSidenav}>
          <BlurView intensity={50} style={StyleSheet.absoluteFill}>
            <View style={styles.overlay} />
          </BlurView>
        </TouchableOpacity>
      )}

      <Sidenav isVisible={isSidenavVisible} onClose={closeSidenav} />

      <View className="p-4">
        <View>
          <View className="flex flex-row flex-grow gap-5 mb-3 justify-center">
            <View className="bg-[#D9D9D9] rounded p-2 w-[45%]">
              <Text>Total Karyawan Absen</Text>
              <Text className="text-2xl">{stats.attendedToday}</Text>
            </View>
            <View className="bg-[#D9D9D9] rounded p-2 w-[45%]">
              <Text>Total Karyawan Izin</Text>
              <Text className="text-2xl">{stats.izinToday}</Text>
            </View>
          </View>
          <View className="bg-[#D9D9D9] rounded p-2 w-[100%]">
            <Text>Total Karyawan</Text>
            <Text className="text-2xl">{stats.totalEmployees}</Text>
          </View>
        </View>

        <View className="mt-4">
          <View className='flex flex-row gap-4'>
            <View>
              <Text className='mb-2'>Tanggal-1:</Text>
              <TouchableOpacity className='border rounded px-2  pr-5 py-1' onPress={() => showDatePicker(true)}>
                <Text className='text-xs'>{selectedDate1 ? selectedDate1 : 'Select Date'}</Text>
              </TouchableOpacity>
            </View>
            <View>
              <Text className='mb-2'>Tanggal-2:</Text>
              <TouchableOpacity className='border rounded px-2  pr-5 py-1' onPress={() => showDatePicker(false)}>
                <Text className='text-xs'>{selectedDate2 ? selectedDate2 : 'Select Date'}</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-1 justify-center">
              <Text className="mb-2">Type:</Text>
              <Dropdown
                style={{ 
                  height: 30,
                  borderColor: 'gray', 
                  borderWidth: 1, 
                  borderRadius: 5, 
                  paddingHorizontal: 8,
                }}
                placeholderStyle={{
                  fontSize: 12,
                  color: 'gray',
                }}
                selectedTextStyle={{
                  fontSize: 12,
                }}
                containerStyle={{
                  backgroundColor: 'white', 
                  borderRadius: 5,
                }}
                data={items}
                maxHeight={200}
                labelField="label"
                valueField="value"
                placeholder={!isFocus ? 'Select an option...' : '...'}
                value={value}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
                onChange={(item) => {
                  setValue(item.value);
                  setIsFocus(false);
                }}
              />
            </View>
          </View>
          <View style={styles.tableContainer}>
            <Table borderStyle={styles.border}>
              <Row data={tableHead} style={styles.tableHead} textStyle={styles.text} />
              <Rows data={filteredData} textStyle={styles.text} />
            </Table>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  selectedDate: {
    marginTop: 10,
    fontSize: 18,
    color: '#000',
  },
  border: {
    borderWidth: 1,
    borderColor: '#c8e1ff',
  },
  text: {
    margin: 6,
    textAlign: 'center',
    fontSize: 11,
  },
});

export default AdminPage;
