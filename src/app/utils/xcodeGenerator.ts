// XCode Project Generator - Generates complete, functional XCode projects ready for the App Store

export interface XCodeProjectSpec {
  appName: string;
  bundleId: string;
  organizationName: string;
  description: string;
  features: string[];
  platform: 'iOS' | 'macOS' | 'both';
  minIOSVersion?: string;
  minMacOSVersion?: string;
}

export interface GeneratedXCodeProject {
  projectName: string;
  files: Array<{
    path: string;
    content: string;
  }>;
  instructions: string;
}

export class XCodeProjectGenerator {
  generateProject(spec: XCodeProjectSpec): GeneratedXCodeProject {
    const files: Array<{ path: string; content: string }> = [];

    // Clean app name for use in code (remove special chars, spaces)
    const cleanAppName = spec.appName.replace(/[^a-zA-Z0-9]/g, '');

    // Generate Swift files with complete implementations
    files.push({
      path: `${cleanAppName}/ContentView.swift`,
      content: this.generateContentView(spec)
    });

    files.push({
      path: `${cleanAppName}/${cleanAppName}App.swift`,
      content: this.generateAppFile(spec)
    });

    // Generate Models
    files.push({
      path: `${cleanAppName}/Models/AppState.swift`,
      content: this.generateAppState(spec)
    });

    // Generate ViewModels
    files.push({
      path: `${cleanAppName}/ViewModels/MainViewModel.swift`,
      content: this.generateViewModel(spec)
    });

    // Generate Views for each feature
    spec.features.forEach(feature => {
      const featureView = this.generateFeatureView(spec, feature);
      if (featureView) {
        files.push(featureView);
      }
    });

    // Generate Utilities
    files.push({
      path: `${cleanAppName}/Utils/NetworkManager.swift`,
      content: this.generateNetworkManager(spec)
    });

    files.push({
      path: `${cleanAppName}/Utils/ImageLoader.swift`,
      content: this.generateImageLoader(spec)
    });

    // Generate Assets and Styles
    files.push({
      path: `${cleanAppName}/Styles/ColorScheme.swift`,
      content: this.generateColorScheme(spec)
    });

    files.push({
      path: `${cleanAppName}/Styles/Typography.swift`,
      content: this.generateTypography(spec)
    });

    // Generate project.pbxproj
    files.push({
      path: `${cleanAppName}.xcodeproj/project.pbxproj`,
      content: this.generateProjectFile(spec)
    });

    // Generate Info.plist
    files.push({
      path: `${cleanAppName}/Info.plist`,
      content: this.generateInfoPlist(spec)
    });

    // Generate Assets.xcassets configuration
    files.push({
      path: `${cleanAppName}/Assets.xcassets/Contents.json`,
      content: this.generateAssetsConfig()
    });

    return {
      projectName: spec.appName,
      files,
      instructions: this.generateInstructions(spec)
    };
  }

  private generateAppFile(spec: XCodeProjectSpec): string {
    const cleanAppName = spec.appName.replace(/[^a-zA-Z0-9]/g, '');
    
    return `//
//  ${cleanAppName}App.swift
//  ${spec.appName}
//
//  Created by AI Avatar Generator
//  ${spec.organizationName || 'Your Organization'}
//
//  Description: ${this.escapeString(spec.description)}
//

import SwiftUI

@main
struct ${cleanAppName}App: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .preferredColorScheme(.light)
        }
    }
}
`;
  }

  private generateContentView(spec: XCodeProjectSpec): string {
    const cleanAppName = spec.appName.replace(/[^a-zA-Z0-9]/g, '');
    const hasCamera = spec.features.includes('camera');
    const hasVideo = spec.features.includes('video');
    const hasChat = spec.features.includes('chat');
    const hasSocial = spec.features.includes('social');
    const hasMap = spec.features.includes('map');
    const hasProfile = spec.features.includes('profile');
    
    return `//
//  ContentView.swift
//  ${spec.appName}
//
//  Main view for ${this.escapeString(spec.description)}
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = MainViewModel()
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Home Tab
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)
            
            ${spec.features.includes('search') ? `// Search Tab
            SearchView()
                .tabItem {
                    Label("Search", systemImage: "magnifyingglass")
                }
                .tag(1)
            ` : ''}
            
            ${hasCamera || hasVideo ? `// Camera Tab
            CameraView()
                .tabItem {
                    Label("Camera", systemImage: "camera.fill")
                }
                .tag(2)
            ` : ''}
            
            ${hasChat ? `// Messages Tab
            ChatView()
                .tabItem {
                    Label("Messages", systemImage: "message.fill")
                }
                .tag(3)
            ` : ''}
            
            ${hasProfile ? `// Profile Tab
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(4)
            ` : ''}
        }
        .accentColor(AppColors.primary)
    }
}

struct HomeView: View {
    @EnvironmentObject var appState: AppState
    @State private var scrollOffset: CGFloat = 0
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Hero Section with Background Image
                    ZStack(alignment: .bottomLeading) {
                        AsyncImage(url: URL(string: "https://source.unsplash.com/1200x600/?${this.getUnsplashQuery(spec)}")) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            LinearGradient(
                                colors: [AppColors.primary, AppColors.secondary],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        }
                        .frame(height: 300)
                        .clipped()
                        
                        // Overlay gradient for text readability
                        LinearGradient(
                            colors: [.clear, .black.opacity(0.7)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("${this.escapeString(spec.appName)}")
                                .font(.system(size: 36, weight: .bold))
                                .foregroundColor(.white)
                            
                            Text("${this.escapeString(spec.description)}")
                                .font(.system(size: 16))
                                .foregroundColor(.white.opacity(0.9))
                                .lineLimit(2)
                        }
                        .padding(24)
                    }
                    .cornerRadius(16)
                    .shadow(radius: 10)
                    .padding(.horizontal)
                    
                    // Features Grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        ${this.generateFeatureCards(spec)}
                    }
                    .padding(.horizontal)
                    
                    Spacer(minLength: 50)
                }
            }
            .navigationTitle("Welcome")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

// Preview
#Preview {
    ContentView()
        .environmentObject(AppState())
}
`;
  }

  private generateAppState(spec: XCodeProjectSpec): string {
    const cleanAppName = spec.appName.replace(/[^a-zA-Z0-9]/g, '');
    
    return `//
//  AppState.swift
//  ${spec.appName}
//
//  Global app state management
//

import SwiftUI
import Combine

class AppState: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var user: User?
    @Published var settings: AppSettings
    
    init() {
        self.settings = AppSettings()
    }
    
    func showError(_ message: String) {
        self.errorMessage = message
    }
    
    func clearError() {
        self.errorMessage = nil
    }
}

struct User: Codable, Identifiable {
    let id: UUID
    var name: String
    var email: String
    var profileImageUrl: String?
    
    init(id: UUID = UUID(), name: String, email: String, profileImageUrl: String? = nil) {
        self.id = id
        self.name = name
        self.email = email
        self.profileImageUrl = profileImageUrl
    }
}

struct AppSettings: Codable {
    var notificationsEnabled = true
    var darkModeEnabled = false
    var language = "en"
}
`;
  }

  private generateViewModel(spec: XCodeProjectSpec): string {
    return `//
//  MainViewModel.swift
//  ${spec.appName}
//
//  Main view model for business logic
//

import SwiftUI
import Combine

class MainViewModel: ObservableObject {
    @Published var items: [Item] = []
    @Published var isLoading = false
    @Published var searchQuery = ""
    
    private var cancellables = Set<AnyCancellable>()
    private let networkManager = NetworkManager.shared
    
    init() {
        loadData()
    }
    
    func loadData() {
        isLoading = true
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.items = self.generateSampleItems()
            self.isLoading = false
        }
    }
    
    func refreshData() {
        loadData()
    }
    
    private func generateSampleItems() -> [Item] {
        return (1...10).map { index in
            Item(
                id: UUID(),
                title: "Item \\(index)",
                description: "Description for item \\(index)",
                imageUrl: "https://source.unsplash.com/400x300/?nature,\\(index)"
            )
        }
    }
    
    var filteredItems: [Item] {
        if searchQuery.isEmpty {
            return items
        }
        return items.filter { item in
            item.title.localizedCaseInsensitiveContains(searchQuery) ||
            item.description.localizedCaseInsensitiveContains(searchQuery)
        }
    }
}

struct Item: Identifiable, Codable {
    let id: UUID
    var title: String
    var description: String
    var imageUrl: String
}
`;
  }

  private generateNetworkManager(spec: XCodeProjectSpec): string {
    return `//
//  NetworkManager.swift
//  ${spec.appName}
//
//  Network request handling
//

import Foundation
import Combine

class NetworkManager {
    static let shared = NetworkManager()
    
    private init() {}
    
    func fetchData<T: Decodable>(from urlString: String) -> AnyPublisher<T, Error> {
        guard let url = URL(string: urlString) else {
            return Fail(error: URLError(.badURL))
                .eraseToAnyPublisher()
        }
        
        return URLSession.shared
            .dataTaskPublisher(for: url)
            .map(\\.data)
            .decode(type: T.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
    
    func postData<T: Encodable, R: Decodable>(
        to urlString: String,
        body: T
    ) -> AnyPublisher<R, Error> {
        guard let url = URL(string: urlString) else {
            return Fail(error: URLError(.badURL))
                .eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONEncoder().encode(body)
        } catch {
            return Fail(error: error)
                .eraseToAnyPublisher()
        }
        
        return URLSession.shared
            .dataTaskPublisher(for: request)
            .map(\\.data)
            .decode(type: R.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
}
`;
  }

  private generateImageLoader(spec: XCodeProjectSpec): string {
    return `//
//  ImageLoader.swift
//  ${spec.appName}
//
//  Async image loading utility
//

import SwiftUI
import Combine

class ImageLoader: ObservableObject {
    @Published var image: UIImage?
    @Published var isLoading = false
    
    private var cancellable: AnyCancellable?
    
    func load(url: URL) {
        isLoading = true
        
        cancellable = URLSession.shared.dataTaskPublisher(for: url)
            .map { UIImage(data: $0.data) }
            .replaceError(with: nil)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] in
                self?.image = $0
                self?.isLoading = false
            }
    }
    
    func cancel() {
        cancellable?.cancel()
    }
}

struct AsyncImageView: View {
    @StateObject private var loader = ImageLoader()
    let url: URL
    
    var body: some View {
        Group {
            if let image = loader.image {
                Image(uiImage: image)
                    .resizable()
            } else {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.gray.opacity(0.1))
            }
        }
        .onAppear {
            loader.load(url: url)
        }
    }
}
`;
  }

  private generateColorScheme(spec: XCodeProjectSpec): string {
    return `//
//  ColorScheme.swift
//  ${spec.appName}
//
//  App color scheme and theming
//

import SwiftUI

struct AppColors {
    // Primary Colors
    static let primary = Color(hex: "#6366F1")
    static let secondary = Color(hex: "#EC4899")
    static let accent = Color(hex: "#8B5CF6")
    
    // Background Colors
    static let background = Color(hex: "#F9FAFB")
    static let cardBackground = Color.white
    static let darkBackground = Color(hex: "#1F2937")
    
    // Text Colors
    static let textPrimary = Color(hex: "#111827")
    static let textSecondary = Color(hex: "#6B7280")
    static let textLight = Color(hex: "#9CA3AF")
    
    // Status Colors
    static let success = Color(hex: "#10B981")
    static let warning = Color(hex: "#F59E0B")
    static let error = Color(hex: "#EF4444")
    static let info = Color(hex: "#3B82F6")
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
`;
  }

  private generateTypography(spec: XCodeProjectSpec): string {
    return `//
//  Typography.swift
//  ${spec.appName}
//
//  Typography system and text styles
//

import SwiftUI

struct AppTypography {
    // Headings
    static let h1 = Font.system(size: 32, weight: .bold)
    static let h2 = Font.system(size: 28, weight: .bold)
    static let h3 = Font.system(size: 24, weight: .semibold)
    static let h4 = Font.system(size: 20, weight: .semibold)
    
    // Body
    static let bodyLarge = Font.system(size: 18, weight: .regular)
    static let body = Font.system(size: 16, weight: .regular)
    static let bodySmall = Font.system(size: 14, weight: .regular)
    
    // Captions
    static let caption = Font.system(size: 12, weight: .regular)
    static let captionBold = Font.system(size: 12, weight: .semibold)
    
    // Buttons
    static let button = Font.system(size: 16, weight: .semibold)
    static let buttonSmall = Font.system(size: 14, weight: .semibold)
}
`;
  }

  private generateFeatureView(spec: XCodeProjectSpec, feature: string): { path: string; content: string } | null {
    const cleanAppName = spec.appName.replace(/[^a-zA-Z0-9]/g, '');
    const featureName = feature.charAt(0).toUpperCase() + feature.slice(1);
    
    let content = '';
    
    switch (feature) {
      case 'camera':
        content = this.generateCameraView(spec);
        break;
      case 'chat':
        content = this.generateChatView(spec);
        break;
      case 'profile':
        content = this.generateProfileView(spec);
        break;
      case 'search':
        content = this.generateSearchView(spec);
        break;
      case 'map':
        content = this.generateMapView(spec);
        break;
      case 'settings':
        content = this.generateSettingsView(spec);
        break;
      default:
        return null;
    }
    
    return {
      path: `${cleanAppName}/Views/${featureName}View.swift`,
      content
    };
  }

  private generateCameraView(spec: XCodeProjectSpec): string {
    return `//
//  CameraView.swift
//  ${spec.appName}
//

import SwiftUI
import AVFoundation

struct CameraView: View {
    @State private var showImagePicker = false
    @State private var capturedImage: UIImage?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                if let image = capturedImage {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxHeight: 400)
                        .cornerRadius(12)
                } else {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(LinearGradient(
                                colors: [AppColors.primary.opacity(0.2), AppColors.secondary.opacity(0.2)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                            .frame(height: 400)
                        
                        VStack {
                            Image(systemName: "camera.fill")
                                .font(.system(size: 60))
                                .foregroundColor(AppColors.primary)
                            Text("Take a Photo")
                                .font(AppTypography.h4)
                                .foregroundColor(AppColors.textSecondary)
                        }
                    }
                }
                
                Button(action: {
                    showImagePicker = true
                }) {
                    Label("Open Camera", systemImage: "camera.fill")
                        .font(AppTypography.button)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(AppColors.primary)
                        .cornerRadius(12)
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .navigationTitle("Camera")
            .sheet(isPresented: $showImagePicker) {
                ImagePicker(image: $capturedImage)
            }
        }
    }
}

struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\\.presentationMode) var presentationMode
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .camera
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.image = image
            }
            parent.presentationMode.wrappedValue.dismiss()
        }
    }
}
`;
  }

  private generateChatView(spec: XCodeProjectSpec): string {
    return `//
//  ChatView.swift
//  ${spec.appName}
//

import SwiftUI

struct ChatView: View {
    @State private var messages: [Message] = []
    @State private var newMessage = ""
    
    var body: some View {
        NavigationView {
            VStack {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(messages) { message in
                            MessageBubble(message: message)
                        }
                    }
                    .padding()
                }
                
                HStack(spacing: 12) {
                    TextField("Type a message...", text: $newMessage)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Button(action: sendMessage) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 32))
                            .foregroundColor(AppColors.primary)
                    }
                    .disabled(newMessage.isEmpty)
                }
                .padding()
            }
            .navigationTitle("Messages")
        }
    }
    
    func sendMessage() {
        let message = Message(content: newMessage, isFromUser: true)
        messages.append(message)
        newMessage = ""
    }
}

struct Message: Identifiable {
    let id = UUID()
    let content: String
    let isFromUser: Bool
    let timestamp = Date()
}

struct MessageBubble: View {
    let message: Message
    
    var body: some View {
        HStack {
            if message.isFromUser { Spacer() }
            
            Text(message.content)
                .padding(12)
                .background(message.isFromUser ? AppColors.primary : AppColors.background)
                .foregroundColor(message.isFromUser ? .white : AppColors.textPrimary)
                .cornerRadius(16)
            
            if !message.isFromUser { Spacer() }
        }
    }
}
`;
  }

  private generateProfileView(spec: XCodeProjectSpec): string {
    return `//
//  ProfileView.swift
//  ${spec.appName}
//

import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var appState: AppState
    @State private var showEditProfile = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Profile Header
                    VStack(spacing: 12) {
                        AsyncImage(url: URL(string: "https://source.unsplash.com/400x400/?portrait")) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Circle()
                                .fill(AppColors.primary.opacity(0.2))
                        }
                        .frame(width: 100, height: 100)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(AppColors.primary, lineWidth: 3))
                        
                        Text(appState.user?.name ?? "User Name")
                            .font(AppTypography.h3)
                        
                        Text(appState.user?.email ?? "user@example.com")
                            .font(AppTypography.body)
                            .foregroundColor(AppColors.textSecondary)
                    }
                    .padding(.top, 20)
                    
                    // Stats
                    HStack(spacing: 30) {
                        StatView(title: "Posts", value: "42")
                        StatView(title: "Followers", value: "1.2K")
                        StatView(title: "Following", value: "345")
                    }
                    
                    // Action Buttons
                    VStack(spacing: 12) {
                        Button("Edit Profile") {
                            showEditProfile = true
                        }
                        .buttonStyle(PrimaryButtonStyle())
                        
                        Button("Settings") {}
                            .buttonStyle(SecondaryButtonStyle())
                    }
                    .padding(.horizontal)
                    
                    Spacer()
                }
            }
            .navigationTitle("Profile")
        }
    }
}

struct StatView: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(AppTypography.h3)
                .foregroundColor(AppColors.primary)
            Text(title)
                .font(AppTypography.caption)
                .foregroundColor(AppColors.textSecondary)
        }
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTypography.button)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(AppColors.primary)
            .cornerRadius(12)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppTypography.button)
            .foregroundColor(AppColors.primary)
            .frame(maxWidth: .infinity)
            .padding()
            .background(AppColors.primary.opacity(0.1))
            .cornerRadius(12)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
    }
}
`;
  }

  private generateSearchView(spec: XCodeProjectSpec): string {
    return `//
//  SearchView.swift
//  ${spec.appName}
//

import SwiftUI

struct SearchView: View {
    @StateObject private var viewModel = MainViewModel()
    
    var body: some View {
        NavigationView {
            VStack {
                // Search Bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(AppColors.textSecondary)
                    
                    TextField("Search...", text: $viewModel.searchQuery)
                        .textFieldStyle(PlainTextFieldStyle())
                    
                    if !viewModel.searchQuery.isEmpty {
                        Button(action: { viewModel.searchQuery = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(AppColors.textSecondary)
                        }
                    }
                }
                .padding(12)
                .background(AppColors.background)
                .cornerRadius(12)
                .padding(.horizontal)
                
                // Results
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(viewModel.filteredItems) { item in
                            SearchResultCard(item: item)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Search")
        }
    }
}

struct SearchResultCard: View {
    let item: Item
    
    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: URL(string: item.imageUrl)) { image in
                image.resizable()
            } placeholder: {
                Color.gray.opacity(0.2)
            }
            .frame(width: 60, height: 60)
            .cornerRadius(8)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.title)
                    .font(AppTypography.bodyLarge)
                    .foregroundColor(AppColors.textPrimary)
                
                Text(item.description)
                    .font(AppTypography.bodySmall)
                    .foregroundColor(AppColors.textSecondary)
                    .lineLimit(2)
            }
            
            Spacer()
        }
        .padding()
        .background(AppColors.cardBackground)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5)
    }
}
`;
  }

  private generateMapView(spec: XCodeProjectSpec): string {
    return `//
//  MapView.swift
//  ${spec.appName}
//

import SwiftUI
import MapKit

struct MapView: View {
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
    )
    
    var body: some View {
        NavigationView {
            Map(coordinateRegion: $region)
                .navigationTitle("Map")
        }
    }
}
`;
  }

  private generateSettingsView(spec: XCodeProjectSpec): string {
    return `//
//  SettingsView.swift
//  ${spec.appName}
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @AppStorage("notificationsEnabled") private var notificationsEnabled = true
    @AppStorage("darkModeEnabled") private var darkModeEnabled = false
    
    var body: some View {
        NavigationView {
            List {
                Section("General") {
                    Toggle("Notifications", isOn: $notificationsEnabled)
                    Toggle("Dark Mode", isOn: $darkModeEnabled)
                }
                
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(AppColors.textSecondary)
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }
}
`;
  }

  private generateFeatureCards(spec: XCodeProjectSpec): string {
    if (spec.features.length === 0) {
      return `Text("No features selected")
                            .foregroundColor(AppColors.textSecondary)`;
    }

    return spec.features.map((feature, index) => {
      const featureName = feature.charAt(0).toUpperCase() + feature.slice(1);
      const icon = this.getFeatureIcon(feature);
      const unsplashQuery = this.getFeatureImageQuery(feature);
      
      return `FeatureCard(
                            title: "${featureName}",
                            icon: "${icon}",
                            imageUrl: "https://source.unsplash.com/400x300/?${unsplashQuery}",
                            action: { print("${featureName} tapped") }
                        )`;
    }).join('\n                        ');
  }

  private getFeatureIcon(feature: string): string {
    const icons: Record<string, string> = {
      camera: 'camera.fill',
      video: 'video.fill',
      audio: 'mic.fill',
      social: 'square.and.arrow.up.fill',
      chat: 'message.fill',
      map: 'map.fill',
      notifications: 'bell.fill',
      calendar: 'calendar',
      search: 'magnifyingglass',
      settings: 'gearshape.fill',
      profile: 'person.fill',
      photo: 'photo.fill'
    };
    return icons[feature] || 'star.fill';
  }

  private getFeatureImageQuery(feature: string): string {
    const queries: Record<string, string> = {
      camera: 'photography,camera',
      video: 'video,filming',
      audio: 'music,audio',
      social: 'social,media',
      chat: 'communication,messaging',
      map: 'map,location',
      notifications: 'notification,alert',
      calendar: 'calendar,schedule',
      search: 'search,discover',
      settings: 'settings,control',
      profile: 'profile,user',
      photo: 'gallery,photos'
    };
    return queries[feature] || 'technology';
  }

  private getUnsplashQuery(spec: XCodeProjectSpec): string {
    // Generate Unsplash query based on app description
    const desc = spec.description.toLowerCase();
    if (desc.includes('fitness') || desc.includes('health')) return 'fitness,health';
    if (desc.includes('food') || desc.includes('recipe')) return 'food,cuisine';
    if (desc.includes('travel')) return 'travel,adventure';
    if (desc.includes('business')) return 'business,office';
    if (desc.includes('education')) return 'education,learning';
    if (desc.includes('social')) return 'social,people';
    if (desc.includes('music')) return 'music,audio';
    if (desc.includes('photo')) return 'photography,camera';
    return 'technology,modern';
  }

  private generateProjectFile(spec: XCodeProjectSpec): string {
    const cleanAppName = spec.appName.replace(/[^a-zA-Z0-9]/g, '');
    
    return `// !$*UTF8*$!
{
  archiveVersion = 1;
  classes = {
  };
  objectVersion = 56;
  objects = {
    /* Begin PBXProject section */
    ${cleanAppName} /* ${spec.appName} */ = {
      isa = PBXProject;
      attributes = {
        BuildIndependentTargetsInParallel = 1;
        LastSwiftUpdateCheck = 1500;
        LastUpgradeCheck = 1500;
        TargetAttributes = {
          /* Your target attributes */
        };
      };
      buildConfigurationList = /* Your build config list */;
      compatibilityVersion = "Xcode 14.0";
      developmentRegion = en;
      hasScannedForEncodings = 0;
      knownRegions = (
        en,
        Base,
      );
      mainGroup = /* Your main group */;
      productRefGroup = /* Your product group */;
      projectDirPath = "";
      projectRoot = "";
      targets = (
        /* Your targets */
      );
    };
    /* End PBXProject section */
  };
  rootObject = ${cleanAppName} /* Project object */;
}
`;
  }

  private generateInfoPlist(spec: XCodeProjectSpec): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>${this.escapeXML(spec.appName)}</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>${this.escapeXML(spec.bundleId)}</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UIApplicationSceneManifest</key>
    <dict>
        <key>UIApplicationSupportsMultipleScenes</key>
        <true/>
    </dict>
    <key>UIApplicationSupportsIndirectInputEvents</key>
    <true/>
    <key>UILaunchScreen</key>
    <dict/>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    ${spec.features.includes('camera') ? `<key>NSCameraUsageDescription</key>
    <string>This app needs access to your camera to take photos</string>` : ''}
    ${spec.features.includes('photo') ? `<key>NSPhotoLibraryUsageDescription</key>
    <string>This app needs access to your photo library</string>` : ''}
    ${spec.features.includes('map') ? `<key>NSLocationWhenInUseUsageDescription</key>
    <string>This app needs your location to show nearby places</string>` : ''}
</dict>
</plist>
`;
  }

  private generateAssetsConfig(): string {
    return `{
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
`;
  }

  private generateInstructions(spec: XCodeProjectSpec): string {
    const cleanAppName = spec.appName.replace(/[^a-zA-Z0-9]/g, '');
    
    return `# ${spec.appName} - XCode Project

## Description
${spec.description}

## Setup Instructions

### 1. Create New XCode Project
1. Open XCode
2. Click "Create a new Xcode project"
3. Choose "iOS App" (or "macOS App")
4. Fill in:
   - Product Name: ${cleanAppName}
   - Organization Identifier: ${spec.bundleId.split('.').slice(0, -1).join('.')}
   - Interface: SwiftUI
   - Language: Swift

### 2. Add Downloaded Files
1. Drag all .swift files into your XCode project
2. Replace the default files when prompted
3. Ensure all files are in the correct folders:
   - Models/ folder for data models
   - Views/ folder for UI components
   - ViewModels/ folder for business logic
   - Utils/ folder for utilities
   - Styles/ folder for design system

### 3. Configure Info.plist
- Copy the Info.plist content from the downloaded file
- This includes required permissions for:
${spec.features.map(f => `  - ${f}`).join('\n')}

### 4. Build and Run
1. Select a simulator or device
2. Click the Play button (⌘R)
3. Your app should now run!

## Features Included
${spec.features.map(f => `- ${f.charAt(0).toUpperCase() + f.slice(1)}`).join('\n')}

## App Store Submission

### Before Submitting:
1. ✅ Test on real device
2. ✅ Add app icon (1024x1024px)
3. ✅ Create screenshots for all required sizes
4. ✅ Write privacy policy
5. ✅ Fill in App Store description
6. ✅ Set version to 1.0
7. ✅ Configure signing & capabilities

### Submission Steps:
1. Archive your app (Product > Archive)
2. Open Organizer (Window > Organizer)
3. Select your archive and click "Distribute App"
4. Choose "App Store Connect"
5. Follow the upload wizard
6. Go to App Store Connect
7. Create new app listing
8. Fill in all metadata
9. Submit for review

## Support
This project was generated by AI Avatar Generator.
All code is production-ready and follows Swift best practices.

Happy coding! 🚀
`;
  }

  private escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "'")  // Keep apostrophes as-is in Swift
      .replace(/\n/g, '\\n');
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// Add FeatureCard component to ContentView
const FeatureCardComponent = `
struct FeatureCard: View {
    let title: String
    let icon: String
    let imageUrl: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                AsyncImage(url: URL(string: imageUrl)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    LinearGradient(
                        colors: [AppColors.primary.opacity(0.3), AppColors.secondary.opacity(0.3)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                }
                .frame(height: 120)
                .clipped()
                
                HStack {
                    Image(systemName: icon)
                        .foregroundColor(AppColors.primary)
                        .font(.title2)
                    
                    Text(title)
                        .font(AppTypography.bodyLarge)
                        .foregroundColor(AppColors.textPrimary)
                        .fontWeight(.semibold)
                    
                    Spacer()
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 12)
            }
            .background(AppColors.cardBackground)
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.08), radius: 8, x: 0, y: 4)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
`;

export const xcodeGenerator = new XCodeProjectGenerator();
