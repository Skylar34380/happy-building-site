FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY src/BuildFlow.Api/BuildFlow.Api.csproj src/BuildFlow.Api/
RUN dotnet restore src/BuildFlow.Api/BuildFlow.Api.csproj

COPY src/BuildFlow.Api/ src/BuildFlow.Api/
RUN dotnet publish src/BuildFlow.Api/BuildFlow.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "BuildFlow.Api.dll"]

