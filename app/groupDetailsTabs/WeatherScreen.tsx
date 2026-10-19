import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator, ScrollView, RefreshControl  } from 'react-native';
import apiClient from '@/api/apiClient';
import { mainBlue } from '@/constants/theme';


interface WeatherData {
  description: string;
  temperature: number;
  feelsLike: number;
  pressure: number;
  humidity: number;
  countryCode: string;
  cityName: string;
  iconUrl: string;
}

type WeatherScreenProps = {
  groupId: string | undefined;
};


const WeatherScreen = ({ groupId }: WeatherScreenProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchWeather = useCallback(async (isRefresh = false) => {
    if (!groupId) return;

    try {
      if (!isRefresh) {
        setLoading(true);
      }
      
      const response = await apiClient.get(`/groups/${groupId}/weather`);
      setWeather(response.data);
    } catch (err: any) {
      console.log("Błąd pobierania pogody:", err);
    } finally {
      setLoading(false);
      setRefreshing(false); 
    }
  }, [groupId]);

  useEffect(() => {
    fetchWeather(false);
  }, [fetchWeather]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWeather(true);
  }, [fetchWeather]);

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getHighResIcon = (url: string) => {
    return url.replace('@2x', '@4x');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Pobieranie danych pogodowych...</Text>
      </View>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container} 
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[mainBlue]} 
        />
      }
    >
      <View style={styles.headerSection}>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      <View style={styles.mainWeatherSection}>
        <Image
          source={{ uri: getHighResIcon(weather.iconUrl) }}
          style={styles.weatherIcon}
          resizeMode="contain"
        />
        <Text style={styles.temperature}>{Math.round(weather.temperature)}°</Text>
        <Text style={styles.description}>{capitalizeFirst(weather.description)}</Text>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <DetailItem
            label="Odczuwalna"
            value={`${Math.round(weather.feelsLike)}°`}
          />
          <DetailItem
            label="Ciśnienie"
            value={`${weather.pressure} hPa`}
          />
          <DetailItem
            label="Wilgotność"
            value={`${weather.humidity}%`}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const DetailItem = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailValue}>{value}</Text>
    <Text style={styles.detailLabel}>{label}</Text>
  </View>
);

export default WeatherScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  headerSection: {
    alignItems: 'center',
  },

  dateText: {
    fontSize: 20,
    fontWeight: '300',
    color: '#2C3E50',
    textAlign: 'center',
  },

  countryCode: {
    fontWeight: '300',
    fontSize: 24,
  },

  mainWeatherSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },

  weatherIcon: {
    width: 250,
    height: 250,
    marginBottom: -20, 
  },

  temperature: {
    fontSize: 86,
    fontWeight: '200',
    color: '#2C3E50',
    letterSpacing: -2,
  },

  description: {
    fontSize: 20,
    color: '#7F8C8D',
    marginTop: 5,
    fontWeight: '500',
  },

  detailsCard: {
    width: "100%",
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 25,
    paddingHorizontal: 10,
    elevation: 5,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  detailItem: {
    alignItems: 'center',
  },

  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34495E',
    marginBottom: 4,
  },

  detailLabel: {
    fontSize: 12,
    color: '#95A5A6',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  loadingText: {
    marginTop: 10,
    color: '#7F8C8D',
  },

  errorText: {
    color: '#E74C3C',
    fontSize: 16,
    textAlign: 'center',
  },
});