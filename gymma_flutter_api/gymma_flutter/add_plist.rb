require 'xcodeproj'
project_path = 'ios/Runner.xcodeproj'
project = Xcodeproj::Project.open(project_path)
app_target = project.targets.find { |t| t.name == 'Runner' }
file_ref = project.main_group.find_subpath(File.join('Runner'), true).new_reference('GoogleService-Info.plist')
app_target.add_file_references([file_ref])
project.save
